"""
Iron Meridian — Image Generator
=================================
Generates concept art from a blueprint brief using Stable Diffusion XL.

Pipeline position:
  Brief JSON → ImageGenerator → concept PNG → TripoSR → OBJ mesh

The generator builds a detailed prompt from the brief's design_notes
and type, optimised specifically for image-to-3D reconstruction quality.

Models supported:
  - SDXL (stabilityai/stable-diffusion-xl-base-1.0) — default
  - Future: Flux.1 Schnell when ungated

Dependencies:
  pip install diffusers accelerate
"""

import os
import sys
from pathlib import Path
from typing import Optional

# ── Prompt templates per blueprint type ──────────────────────────────────────
# Engineered for TripoSR reconstruction quality:
# - Single centered object
# - Neutral/white background
# - Front-facing orthographic
# - Hard edges and clear silhouette
# - No grids, no multiple views

TYPE_PROMPTS = {
    "mech": (
        "single bipedal combat mech, front view, centered, neutral grey background, "
        "hard surface mechanical armor, industrial design, detailed paneling, "
        "concept art, 3d render, octane render, sharp edges, full body visible"
    ),
    "drone": (
        "single military UAV drone, front view, centered, pure white background, "
        "hard surface design, quadrotor, mechanical, concept art, 3d render, "
        "sharp details, full body visible, product photography"
    ),
    "ship": (
        "single naval warship, side profile view, centered, pure white background, "
        "hard surface design, military vessel, detailed hull, concept art, "
        "3d render, sharp edges, full vessel visible"
    ),
    "castle": (
        "single medieval fortress castle, front view, centered, white background, "
        "stone architecture, towers, battlements, concept art, 3d render, "
        "sharp details, full structure visible"
    ),
    "server": (
        "single server rack unit, front view, centered, white background, "
        "data center hardware, clean industrial design, concept art, "
        "3d render, sharp edges, full unit visible"
    ),
    "fantasy": (
        "single fantasy creature, front view, centered, pure white background, "
        "detailed design, concept art, 3d render, sharp details, "
        "full body visible, character design"
    ),
    "default": (
        "single object, front view, centered, pure white background, "
        "hard surface design, concept art, 3d render, sharp edges, "
        "full object visible, product photography style"
    ),
}

NEGATIVE_PROMPT = (
    "multiple views, grid layout, collage, sheet, turnaround, "
    "background environment, landscape, blurry, out of focus, "
    "sketch, line art, 2d flat, cartoon, anime, chibi, "
    "text, watermark, signature, logo, humans, people, "
    "soft shadows, gradient background, busy background, "
    "cut off, cropped, partial, fisheye, distorted"
)


class ImageGenerator:
    """
    Generates concept art images from blueprint briefs.
    Uses SDXL with prompts optimised for image-to-3D reconstruction.
    """

    def __init__(self, model_id: str = "stabilityai/stable-diffusion-xl-base-1.0"):
        self.model_id = model_id
        self._pipe = None
        self._device = None

    def is_available(self) -> bool:
        try:
            import diffusers  # noqa
            import torch       # noqa
            return True
        except ImportError:
            return False

    def _load_pipeline(self):
        """Lazy-load the SDXL pipeline on first use."""
        if self._pipe is not None:
            return self._pipe, self._device

        import torch
        from diffusers import StableDiffusionXLPipeline

        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if self._device == "cuda" else torch.float32

        print(f"[image_gen] Loading SDXL on {self._device}...")
        pipe = StableDiffusionXLPipeline.from_pretrained(
            self.model_id,
            torch_dtype=dtype,
            use_safetensors=True,
        )
        pipe = pipe.to(self._device)

        # Memory optimisations for large VRAM cards
        pipe.enable_attention_slicing()

        self._pipe = pipe
        print("[image_gen] SDXL loaded.")
        return self._pipe, self._device

    def generate(
        self,
        brief: dict,
        output_path: str,
        width: int = 1024,
        height: int = 1024,
        steps: int = 30,
        guidance_scale: float = 8.0,
    ) -> str:
        """
        Generate a concept image from a blueprint brief.

        Args:
            brief:          Validated blueprint brief dict
            output_path:    Where to save the PNG
            width/height:   Image dimensions (1024x1024 is SDXL native)
            steps:          Inference steps (30 = good quality/speed balance)
            guidance_scale: Prompt adherence (7-9 recommended)

        Returns:
            Path to the saved PNG file.
        """
        pipe, device = self._load_pipeline()

        # Build prompt from brief
        bp_type     = brief.get("type", "default")
        design_notes = brief.get("design_notes", "").strip()
        name        = brief.get("name", "")
        systems     = brief.get("systems", [])

        # Base template for this type
        base_prompt = TYPE_PROMPTS.get(bp_type, TYPE_PROMPTS["default"])

        # Inject specific design details from the brief
        detail_parts = []
        if design_notes:
            detail_parts.append(design_notes)
        if systems:
            # Add up to 4 key systems as visual features
            detail_parts.append(", ".join(s.lower() for s in systems[:4]))

        if detail_parts:
            prompt = f"{base_prompt}, {', '.join(detail_parts)}"
        else:
            prompt = base_prompt

        print(f"[image_gen] Generating concept art for: {name}")
        print(f"[image_gen] Prompt: {prompt[:120]}...")

        import torch
        with torch.no_grad():
            result = pipe(
                prompt=prompt,
                negative_prompt=NEGATIVE_PROMPT,
                num_inference_steps=steps,
                guidance_scale=guidance_scale,
                width=width,
                height=height,
            )

        image = result.images[0]

        # Remove background for better TripoSR reconstruction
        image = self._remove_background(image)

        # Save
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        image.save(output_path)
        print(f"[image_gen] Saved to {output_path}")
        return output_path

    def _remove_background(self, image):
        """
        Remove background using rembg for cleaner TripoSR reconstruction.
        Falls back to original image if rembg fails.
        """
        try:
            from rembg import remove
            from PIL import Image
            import io

            # Convert to bytes, remove bg, convert back
            buf = io.BytesIO()
            image.save(buf, format="PNG")
            buf.seek(0)
            output = remove(buf.read())
            result = Image.open(io.BytesIO(output)).convert("RGBA")

            # Composite onto white background for TripoSR
            white = Image.new("RGBA", result.size, (255, 255, 255, 255))
            white.paste(result, mask=result.split()[3])
            return white.convert("RGB")

        except Exception as e:
            print(f"[image_gen] Background removal failed ({e}), using original.")
            return image


# ── Module-level singleton ────────────────────────────────────────────────────
_generator: Optional[ImageGenerator] = None


def get_generator() -> ImageGenerator:
    global _generator
    if _generator is None:
        _generator = ImageGenerator()
    return _generator


def generate_concept_image(brief: dict, output_path: str) -> Optional[str]:
    """
    Convenience function for use in the service pipeline.
    Returns the output path on success, None on failure.
    """
    try:
        gen = get_generator()
        if not gen.is_available():
            print("[image_gen] diffusers not available, skipping image generation.")
            return None
        return gen.generate(brief, output_path)
    except Exception as e:
        print(f"[image_gen] Generation failed: {e}")
        import traceback
        traceback.print_exc()
        return None
