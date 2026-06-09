"""
Iron Meridian — TripoSR Mesh Model
====================================
Image-to-3D via Stability AI's TripoSR.

ACTIVE — Phase 2 implementation.

VRAM:  ~4GB
Speed: ~10s on GPU
Input: Image (concept art from image generation stage)
       Falls back to stub geometry if no image available.
"""

import io
import os
import sys
import tempfile
from pathlib import Path

from .base import MeshModel

# Path to the cloned TripoSR repo
TRIPOSR_PATH = Path(__file__).parent.parent.parent / "TripoSR"


class TripoSRModel(MeshModel):

    display_name     = "TripoSR"
    vram_requirement = "~4GB"
    approx_time      = "~10s"
    input_type       = "image"

    def __init__(self):
        self._model = None

    def is_available(self) -> bool:
        return TRIPOSR_PATH.exists() and (TRIPOSR_PATH / "tsr").exists()

    def _load_model(self):
        """Lazy-load the model on first use."""
        if self._model is not None:
            return self._model

        if not self.is_available():
            raise RuntimeError(f"TripoSR not found at {TRIPOSR_PATH}")

        # Add TripoSR to path
        if str(TRIPOSR_PATH) not in sys.path:
            sys.path.insert(0, str(TRIPOSR_PATH))

        import torch
        from tsr.system import TSR

        device = "cuda:0" if torch.cuda.is_available() else "cpu"
        print(f"[triposr] Loading model on {device}...")

        model = TSR.from_pretrained(
            "stabilityai/TripoSR",
            config_name="config.yaml",
            weight_name="model.ckpt",
        )
        model.renderer.set_chunk_size(8192)
        model.to(device)
        self._model = (model, device)
        print(f"[triposr] Model loaded.")
        return self._model

    def generate(self, brief: dict) -> str:
        """
        Generate a 3D mesh from a concept image or design notes.
        Falls back to stub geometry if no image is available.
        """
        import torch
        import numpy as np
        from PIL import Image

        # Check for concept image from image generation stage (Phase 3)
        concept_image_path = brief.get("_concept_image_path")

        if not concept_image_path or not Path(concept_image_path).exists():
            # No concept image yet — use stub geometry
            print("[triposr] No concept image found, using stub geometry.")
            return self._select_stub_geometry(brief)

        try:
            model, device = self._load_model()

            image = Image.open(concept_image_path).convert("RGB")

            with torch.no_grad():
                scene_codes = model([image], device=device)

            meshes = model.extract_mesh(
                scene_codes,
                has_vertex_color=False,
                resolution=256,
            )
            mesh = meshes[0]

            # Export to OBJ string
            with tempfile.NamedTemporaryFile(suffix=".obj", delete=False) as f:
                tmp_path = f.name

            mesh.export(tmp_path)
            obj_string = Path(tmp_path).read_text()
            os.unlink(tmp_path)

            print(f"[triposr] Mesh generated successfully.")
            return obj_string

        except Exception as e:
            print(f"[triposr] Generation failed: {e}, falling back to stub.")
            return self._select_stub_geometry(brief)
