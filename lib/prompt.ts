/**
 * Prompt for the image-edit model. The photo to edit is always "Picture 1"; the
 * optional style reference (the first styled photo of the set) is "Picture 2".
 * Qwen-Image-Edit labels input images exactly like that in its chat template.
 *
 * Kept short on purpose: the text encoder truncates at 512 tokens including its
 * own system template.
 */

export const PRESERVE_RULES = [
  "This is a real photo. Keep the exact same scene, framing, composition and camera angle.",
  "Keep every person exactly as they are: same faces, facial features, identity, age, expressions, hair, bodies, body shape, poses and clothing.",
  "Do not add, remove, move or replace any people, animals or objects. Do not add text, logos, borders or watermarks.",
  "Only improve photo quality (sharper detail, less noise and compression artefacts, balanced exposure, recovered highlights and shadows) and apply the colour grade and look described below.",
  "The result must look like a real photograph, not AI art or a painting.",
].join(" ");

export const NEGATIVE_PROMPT =
  "different person, changed face, distorted face, extra people, extra limbs, deformed hands, added objects, removed objects, text, watermark, logo, border, cartoon, illustration, painting, 3d render, plastic skin, oversmoothed, oversharpened, blurry, low quality";

export function buildPrompt(stylePrompt: string, hasReference: boolean): { prompt: string; negativePrompt: string } {
  const parts = [`Retouch Picture 1. ${PRESERVE_RULES}`, `Look: ${stylePrompt}`];
  if (hasReference) {
    parts.push(
      "Picture 2 is a style reference from the same photo set: match its colour grade, white balance, contrast, saturation, grain and mood as closely as possible so both photos look like one consistent set. Use Picture 2 only for the look; do not copy any of its content, people or composition into Picture 1.",
    );
  }
  return { prompt: parts.join("\n"), negativePrompt: NEGATIVE_PROMPT };
}
