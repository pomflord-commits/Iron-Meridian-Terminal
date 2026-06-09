"""
Iron Meridian — OpenLRM Model
================================
Image-to-3D via OpenLRM (Large Reconstruction Model).

Phase 1: Returns stub geometry.
Phase 2: Wire up real OpenLRM inference.

Installation (Phase 2):
  pip install openlrm
  # Weights download automatically from HuggingFace on first run

VRAM:  ~24GB
Speed: ~90s
Input: Image (concept art from image generation stage)
Notes: Maximum quality option. Uses full 24GB on 7900 XTX.
       Unload Ollama before running to avoid OOM.
       Best topology for complex mechanical subjects.
       Worth the wait for final blueprint versions.
"""

from .base import MeshModel


class OpenLRMModel(MeshModel):

    display_name     = "OpenLRM"
    vram_requirement = "~24GB"
    approx_time      = "~90s"
    input_type       = "image"

    def is_available(self) -> bool:
        try:
            import openlrm  # noqa: F401
            return True
        except ImportError:
            return False

    def generate(self, brief: dict) -> str:
        """
        Phase 1: Return type-appropriate stub geometry.

        Phase 2 implementation:
          import openlrm
          from PIL import Image

          concept_image = brief.get('_concept_image_path')
          if not concept_image:
              raise RuntimeError("OpenLRM requires a concept image.")

          # Load model (downloads weights on first run ~2GB)
          model = openlrm.load('zxhezexin/openlrm-mix-large-1.1')

          image = Image.open(concept_image).convert('RGBA')
          planes = model.infer_single(
              image,
              render_size=384,
              mesh_size=512,
              export_video=False,
              export_mesh=True,
          )

          # planes['mesh'] is a trimesh.Trimesh object
          mesh = planes['mesh']

          import io
          buf = io.BytesIO()
          mesh.export(buf, file_type='obj')
          return buf.getvalue().decode()
        """
        # ── Phase 1 stub ──────────────────────────────────────────────────────
        return self._select_stub_geometry(brief)
