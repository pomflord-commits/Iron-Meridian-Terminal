"""
Iron Meridian — Shap-E Mesh Model
===================================
Text-to-3D via OpenAI's Shap-E (open source).

Phase 1: Returns stub geometry.
Phase 2: Wire up real Shap-E inference.

Installation (Phase 2):
  pip install git+https://github.com/openai/shap-e.git

VRAM:  ~6GB
Speed: ~15s
Input: Text (design_notes from brief)
Notes: Skips image generation stage entirely.
       Output quality is low — good for fast previews only.
"""

from .base import MeshModel


class ShapEModel(MeshModel):

    display_name     = "Shap-E"
    vram_requirement = "~6GB"
    approx_time      = "~15s"
    input_type       = "text"

    def is_available(self) -> bool:
        try:
            import shap_e  # noqa: F401
            return True
        except ImportError:
            return False

    def generate(self, brief: dict) -> str:
        """
        Phase 1: Return type-appropriate stub geometry.

        Phase 2 implementation:
          from shap_e.diffusion.sample import sample_latents
          from shap_e.diffusion.gaussian_diffusion import diffusion_from_config
          from shap_e.models.download import load_model, load_config
          from shap_e.util.notebooks import decode_latent_mesh

          xm      = load_model('transmitter', device=device)
          model   = load_model('text300M', device=device)
          diffusion = diffusion_from_config(load_config('diffusion'))

          prompt  = brief.get('design_notes') or brief.get('name', 'mech')
          latents = sample_latents(
              batch_size=1, model=model, diffusion=diffusion,
              guidance_scale=15.0,
              model_kwargs=dict(texts=[prompt]),
              progress=True, clip_denoised=True,
              use_fp16=True, use_karras=True,
              karras_steps=64, sigma_min=1e-3, sigma_max=160,
          )
          mesh = decode_latent_mesh(xm, latents[0]).tri_mesh()
          # Convert to OBJ string
          buf = io.StringIO()
          mesh.write_obj(buf)
          return buf.getvalue()
        """
        # ── Phase 1 stub ──────────────────────────────────────────────────────
        return self._select_stub_geometry(brief)
