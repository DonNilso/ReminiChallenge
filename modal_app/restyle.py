"""
Creator Studio: restyle service on Modal.

Runs Qwen-Image-Edit-2511 (Apache-2.0, open weights) with the Lightning 4-step LoRA
on one H100 per container. The Next.js API route calls it once per photo:

    POST /restyle   {image_b64, reference_b64?, prompt, negative_prompt, seed, color_lock}
    GET  /health    -> {"ok": true}   (also used to pre-warm a container)

The photo to edit is passed to the model as "Picture 1" and the optional style
reference (the first styled photo of the set) as "Picture 2"; the prompt (built in
lib/prompt.ts) refers to them by those names.

Deploy:   modal deploy modal_app/restyle.py
Dev:      modal serve modal_app/restyle.py

Nothing is written to disk except the model weights cache (a Modal Volume).
Photos only live in memory for the duration of a request.
"""

from __future__ import annotations

import base64
import io
import math
import os
import time

import modal

APP_NAME = "creator-studio"
MODEL_ID = os.environ.get("CS_MODEL_ID", "Qwen/Qwen-Image-Edit-2511")
LORA_REPO = os.environ.get("CS_LORA_REPO", "lightx2v/Qwen-Image-Edit-2511-Lightning")
LORA_FILE = os.environ.get("CS_LORA_FILE", "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors")
# Set CS_USE_LIGHTNING=0 at deploy time for the full 40-step model (≈10x slower, slightly higher fidelity).
USE_LIGHTNING = os.environ.get("CS_USE_LIGHTNING", "1") == "1"
GPU = os.environ.get("CS_GPU", "H100")
TARGET_PIXELS = 1024 * 1024  # the model is trained around 1 MP
CACHE_DIR = "/cache"

image = (
    modal.Image.debian_slim(python_version="3.12")
    .uv_pip_install(
        "torch==2.15.0",
        "diffusers==0.43.0",
        "transformers==5.23.0",
        "accelerate==1.15.0",
        "peft==0.21.3",
        "safetensors",
        "huggingface_hub[hf_xet]==2.4.0",
        "pillow==13.0.0",
        "numpy",
        "fastapi[standard]==0.163.1",
    )
    .env(
        {
            "HF_HOME": CACHE_DIR,
            "CS_MODEL_ID": MODEL_ID,
            "CS_LORA_REPO": LORA_REPO,
            "CS_LORA_FILE": LORA_FILE,
            "CS_USE_LIGHTNING": "1" if USE_LIGHTNING else "0",
        }
    )
)

cache = modal.Volume.from_name("creator-studio-hf-cache", create_if_missing=True)
app = modal.App(APP_NAME)


# ---------------------------------------------------------------------------
# Pure helpers (no GPU, unit-tested in modal_app/test_restyle.py)
# ---------------------------------------------------------------------------


def output_size(width: int, height: int, target_pixels: int = TARGET_PIXELS) -> tuple[int, int]:
    """Same aspect ratio as the input, ~target_pixels in area, both sides multiples of 32."""
    ratio = width / height
    w = math.sqrt(target_pixels * ratio)
    h = w / ratio
    return max(32, round(w / 32) * 32), max(32, round(h / 32) * 32)


def decode_image(b64: str):
    from PIL import Image, ImageOps

    if "," in b64[:100]:  # tolerate data URLs
        b64 = b64.split(",", 1)[1]
    img = Image.open(io.BytesIO(base64.b64decode(b64)))
    img = ImageOps.exif_transpose(img)
    return img.convert("RGB")


def encode_jpeg(img, quality: int = 92) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, subsampling=0, optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


_D65 = (0.95047, 1.0, 1.08883)
_RGB2XYZ = (
    (0.4124564, 0.3575761, 0.1804375),
    (0.2126729, 0.7151522, 0.0721750),
    (0.0193339, 0.1191920, 0.9503041),
)


def _rgb_to_lab(rgb):
    import numpy as np

    c = rgb.astype(np.float32) / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    xyz = c @ np.array(_RGB2XYZ, dtype=np.float32).T / np.array(_D65, dtype=np.float32)
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def _lab_to_rgb(lab):
    import numpy as np

    fy = (lab[..., 0] + 16) / 116
    fx = fy + lab[..., 1] / 500
    fz = fy - lab[..., 2] / 200
    f = np.stack([fx, fy, fz], axis=-1)
    xyz = np.where(f**3 > 216 / 24389, f**3, (116 * f - 16) / (24389 / 27)) * np.array(_D65, dtype=np.float32)
    c = xyz @ np.linalg.inv(np.array(_RGB2XYZ, dtype=np.float32)).T
    c = np.clip(c, 0, 1)
    c = np.where(c <= 0.0031308, 12.92 * c, 1.055 * c ** (1 / 2.4) - 0.055)
    return np.clip(np.round(c * 255), 0, 255).astype(np.uint8)


def color_lock(img, reference, strength: float):
    """
    Reinhard-style colour transfer in CIE Lab: nudge the per-channel mean and std of
    `img` towards `reference`. The model sets the look; this deterministic step pulls
    every photo of the set onto the same colour statistics as the anchor. strength=0
    is a no-op, 1 is a full transfer (too strong for scenes with very different content).
    Lightness is moved half as much as colour so each photo keeps its own exposure structure.
    """
    import numpy as np
    from PIL import Image

    if strength <= 0:
        return img
    strength = min(1.0, strength)
    src = _rgb_to_lab(np.asarray(img.convert("RGB")))
    ref = _rgb_to_lab(np.asarray(reference.convert("RGB")))
    out = np.empty_like(src)
    for c in range(3):
        s_mean, s_std = src[..., c].mean(), src[..., c].std() + 1e-6
        r_mean, r_std = ref[..., c].mean(), ref[..., c].std() + 1e-6
        k = strength * (0.5 if c == 0 else 1.0)
        target_std = s_std + (r_std - s_std) * k
        target_mean = s_mean + (r_mean - s_mean) * k
        out[..., c] = (src[..., c] - s_mean) * (target_std / s_std) + target_mean
    return Image.fromarray(_lab_to_rgb(out))


# Scheduler settings published with the Qwen-Image Lightning LoRAs.
LIGHTNING_SCHEDULER = {
    "base_image_seq_len": 256,
    "base_shift": math.log(3),
    "invert_sigmas": False,
    "max_image_seq_len": 8192,
    "max_shift": math.log(3),
    "num_train_timesteps": 1000,
    "shift": 1.0,
    "shift_terminal": None,
    "stochastic_sampling": False,
    "time_shift_type": "exponential",
    "use_beta_sigmas": False,
    "use_dynamic_shifting": True,
    "use_exponential_sigmas": False,
    "use_karras_sigmas": False,
}


# ---------------------------------------------------------------------------
# GPU service
# ---------------------------------------------------------------------------


@app.cls(
    gpu=GPU,
    image=image,
    volumes={CACHE_DIR: cache},
    timeout=600,
    startup_timeout=1800,  # first boot downloads ~58 GB of weights into the Volume
    scaledown_window=240,  # keep a warm container for 4 min after the last request
    max_containers=3,  # matches the app's concurrency limit
)
@modal.concurrent(max_inputs=1)
class Restyler:
    @modal.enter()
    def load(self):
        import torch
        from diffusers import FlowMatchEulerDiscreteScheduler, QwenImageEditPlusPipeline

        t0 = time.time()
        kwargs = {"torch_dtype": torch.bfloat16}
        if USE_LIGHTNING:
            kwargs["scheduler"] = FlowMatchEulerDiscreteScheduler.from_config(LIGHTNING_SCHEDULER)
        pipe = QwenImageEditPlusPipeline.from_pretrained(MODEL_ID, **kwargs)
        if USE_LIGHTNING:
            pipe.load_lora_weights(LORA_REPO, weight_name=LORA_FILE)
            pipe.fuse_lora()
        pipe.to("cuda")
        pipe.set_progress_bar_config(disable=True)
        self.pipe = pipe
        self.steps = 4 if USE_LIGHTNING else 40
        self.cfg = 1.0 if USE_LIGHTNING else 4.0
        cache.commit()  # persist any newly downloaded weights
        print(f"model loaded in {time.time() - t0:.1f}s (lightning={USE_LIGHTNING})")

    def restyle(self, body: dict) -> dict:
        import torch

        t0 = time.time()
        target = decode_image(body["image_b64"])
        images = [target]
        reference = None
        if body.get("reference_b64"):
            reference = decode_image(body["reference_b64"])
            images.append(reference)

        width, height = output_size(*target.size)
        seed = int(body.get("seed", 42))
        result = self.pipe(
            image=images,
            prompt=body["prompt"],
            negative_prompt=body.get("negative_prompt") or " ",
            true_cfg_scale=self.cfg,
            num_inference_steps=self.steps,
            width=width,
            height=height,
            generator=torch.Generator(device="cuda").manual_seed(seed),
        ).images[0]

        lock = float(body.get("color_lock", 0))
        if reference is not None and lock > 0:
            result = color_lock(result, reference, lock)

        return {
            "image_b64": encode_jpeg(result),
            "width": result.width,
            "height": result.height,
            "inference_seconds": round(time.time() - t0, 2),
            "steps": self.steps,
            "model": MODEL_ID,
        }

    @modal.asgi_app(requires_proxy_auth=True)
    def web(self):
        from fastapi import FastAPI, HTTPException
        from fastapi.concurrency import run_in_threadpool

        api = FastAPI(title="Creator Studio restyle")

        @api.get("/health")
        def health():
            return {"ok": True, "model": MODEL_ID, "lightning": USE_LIGHTNING}

        @api.post("/restyle")
        async def restyle(body: dict):
            if not body.get("image_b64") or not body.get("prompt"):
                raise HTTPException(status_code=400, detail="image_b64 and prompt are required")
            try:
                return await run_in_threadpool(self.restyle, body)
            except Exception as e:
                if type(e).__name__ == "OutOfMemoryError":
                    # Retryable from the client's point of view.
                    raise HTTPException(status_code=503, detail="GPU out of memory, retry") from e
                raise

        return api

    @modal.method()
    def restyle_remote(self, body: dict) -> dict:
        return self.restyle(body)


@app.local_entrypoint()
def smoke(image_path: str, reference_path: str = "", out: str = "restyled.jpg"):
    """`modal run modal_app/restyle.py --image-path photo.jpg` restyles one photo for a quick check."""
    def b64(p: str) -> str:
        with open(p, "rb") as f:
            return base64.b64encode(f.read()).decode()

    body = {
        "image_b64": b64(image_path),
        "prompt": (
            "Edit Picture 1. Keep the same scene, people, faces and composition. "
            "Apply a warm golden-hour colour grade with soft film grain."
        ),
        "seed": 42,
    }
    if reference_path:
        body["reference_b64"] = b64(reference_path)
    res = Restyler().restyle_remote.remote(body)
    with open(out, "wb") as f:
        f.write(base64.b64decode(res["image_b64"]))
    print(f"wrote {out} ({res['width']}x{res['height']}) in {res['inference_seconds']}s")
