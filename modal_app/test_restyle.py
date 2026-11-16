"""Offline tests for the pure helpers in restyle.py (no GPU, no Modal account needed).

    pip install modal pillow numpy pytest && pytest modal_app
"""

import base64
import io

import numpy as np
from PIL import Image

import restyle


def _img(color, size=(64, 48)):
    return Image.new("RGB", size, color)


def test_output_size_keeps_aspect_and_multiple_of_32():
    for w, h in [(1600, 1200), (1200, 1600), (1600, 900), (1080, 1350), (1000, 1000)]:
        ow, oh = restyle.output_size(w, h)
        assert ow % 32 == 0 and oh % 32 == 0
        assert abs((ow / oh) - (w / h)) < 0.05
        assert 0.9e6 < ow * oh < 1.15e6


def test_decode_roundtrip_and_data_url():
    buf = io.BytesIO()
    _img((200, 10, 10)).save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    assert restyle.decode_image(b64).size == (64, 48)
    assert restyle.decode_image("data:image/png;base64," + b64).mode == "RGB"
    out = restyle.decode_image(restyle.encode_jpeg(_img((10, 200, 10))))
    assert out.size == (64, 48)


def test_color_lock_moves_towards_reference():
    rng = np.random.default_rng(0)
    src = Image.fromarray((rng.random((48, 64, 3)) * 80 + 20).astype(np.uint8))  # dark, neutral
    ref = Image.fromarray((rng.random((48, 64, 3)) * 60 + [180, 120, 60]).astype(np.uint8))  # warm, bright
    base = np.asarray(src).astype(float).mean(axis=(0, 1))
    target = np.asarray(ref).astype(float).mean(axis=(0, 1))
    half = np.asarray(restyle.color_lock(src, ref, 0.5)).astype(float).mean(axis=(0, 1))
    full = np.asarray(restyle.color_lock(src, ref, 1.0)).astype(float).mean(axis=(0, 1))
    d = lambda a: np.linalg.norm(a - target)
    assert d(full) < d(half) < d(base)
    assert restyle.color_lock(src, ref, 0) is src


def test_lab_roundtrip():
    rng = np.random.default_rng(1)
    rgb = (rng.random((32, 32, 3)) * 255).astype(np.uint8)
    back = restyle._lab_to_rgb(restyle._rgb_to_lab(rgb))
    assert np.abs(back.astype(int) - rgb.astype(int)).max() <= 1
