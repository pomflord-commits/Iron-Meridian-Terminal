"""
Iron Meridian — InstantMesh Model
===================================
Image-to-3D via InstantMesh (Tencent).

Phase 1: Returns stub geometry.
Phase 2: Wire up real InstantMesh inference.

Installation (Phase 2):
  git clone https://github.com/TencentARC/InstantMesh
  cd InstantMesh && pip install -r requirements.txt

VRAM:  ~16GB
Speed: ~60s
Input: Image (concept art from image generation stage)
Notes: Best quality/speed balance. Recommended default for 7900 XTX.
       Produces cleaner topology than TripoSR — significantly better
       SVG wireframe output on mechanical/architectural subjects.
       Leaves 8GB VRAM headroom when running alongside Ollama.
"""

from .base import MeshModel


class InstantMeshModel(MeshModel):

    display_name     = "InstantMesh"
    vram_requirement = "~16GB"
    approx_time      = "~60s"
    input_type       = "image"

    def is_available(self) -> bool:
        try:
            # InstantMesh uses a local gradio pipeline
            # Check for the cloned repo's src directory
            import importlib.util
            spec = importlib.util.find_spec("src.utils.train_util")
            return spec is not None
        except Exception:
            return False

    def generate(self, brief: dict) -> str:
        """
        Phase 1: Return type-appropriate stub geometry.

        Phase 2 implementation:
          import subprocess, tempfile, os

          # InstantMesh is typically invoked as a subprocess since it
          # ships as a Gradio app / inference script rather than a library.
          # The cleanest Phase 2 approach is a thin wrapper:

          concept_image = brief.get('_concept_image_path')
          if not concept_image:
              raise RuntimeError("InstantMesh requires a concept image. "
                                 "Run image generation stage first.")

          with tempfile.TemporaryDirectory() as tmpdir:
              output_path = os.path.join(tmpdir, 'output.obj')
              subprocess.run([
                  'python', 'InstantMesh/run.py',
                  '--input', concept_image,
                  '--output', output_path,
                  '--export-texmap',
              ], check=True, timeout=300)

              with open(output_path) as f:
                  return f.read()

          # Alternatively, once packaged properly:
          # from instantmesh.pipeline import InstantMeshPipeline
          # pipeline = InstantMeshPipeline.from_pretrained('TencentARC/InstantMesh')
          # mesh = pipeline(Image.open(concept_image))
          # return mesh.export_obj()
        """
        # ── Phase 1 stub ──────────────────────────────────────────────────────
        return self._select_stub_geometry(brief)
