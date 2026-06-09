"""
Iron Meridian — Base Mesh Model Interface
==========================================
Every mesh model must implement this interface.

To add a new model:
  1. Create mesh_models/your_model.py
  2. Subclass MeshModel
  3. Implement generate() and is_available()
  4. Register in service.py MESH_MODELS dict

The generate() method receives a validated brief dict and must return
a raw OBJ file as a string. The renderer handles everything after that.
"""

from abc import ABC, abstractmethod


class MeshModel(ABC):

    # Human-readable name shown in the UI
    display_name: str = "Unknown Model"

    # Approximate VRAM requirement string for the UI
    vram_requirement: str = "?"

    # Approximate generation time string for the UI
    approx_time: str = "?"

    # Whether this model accepts text input, image input, or both
    input_type: str = "image"   # "text" | "image" | "both"

    @abstractmethod
    def generate(self, brief: dict) -> str:
        """
        Generate a 3D mesh from a blueprint brief.

        Args:
            brief: Validated engineering brief dict from brief_extractor.
                   Keys: type, name, role, height, weight, specs,
                         systems, design_notes

        Returns:
            OBJ file content as a raw string.
            Must be valid OBJ that trimesh can load.

        Raises:
            NotImplementedError: If the model is a stub (Phase 1)
            RuntimeError:        If generation fails at runtime
        """
        ...

    @abstractmethod
    def is_available(self) -> bool:
        """
        Return True if this model's dependencies are installed
        and weights are accessible. Used for the /health endpoint
        and UI status indicators.
        """
        ...

    def get_info(self) -> dict:
        """Metadata dict returned by /health endpoint."""
        return {
            "display_name":   self.display_name,
            "vram":           self.vram_requirement,
            "approx_time":    self.approx_time,
            "input_type":     self.input_type,
            "available":      self.is_available(),
        }

    # ── Shared OBJ utilities available to all subclasses ─────────────────────

    @staticmethod
    def _make_box_obj(
        width: float = 1.0,
        height: float = 1.6,
        depth: float = 0.8,
    ) -> str:
        """
        Generate a simple box OBJ as a universal fallback geometry.
        Subclasses can call this during Phase 1 stub implementations.
        """
        w, h, d = width / 2, height / 2, depth / 2
        verts = [
            (-w, -h, -d), ( w, -h, -d), ( w,  h, -d), (-w,  h, -d),
            (-w, -h,  d), ( w, -h,  d), ( w,  h,  d), (-w,  h,  d),
        ]
        faces = [
            (1,2,3), (1,3,4),   # front
            (5,6,7), (5,7,8),   # back (flipped for correct winding)
            (1,2,6), (1,6,5),   # bottom
            (4,3,7), (4,7,8),   # top
            (1,4,8), (1,8,5),   # left
            (2,3,7), (2,7,6),   # right
        ]
        lines = ["# Iron Meridian placeholder geometry", ""]
        for v in verts:
            lines.append(f"v {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}")
        lines.append("")
        for f in faces:
            lines.append(f"f {f[0]} {f[1]} {f[2]}")
        return "\n".join(lines)

    @staticmethod
    def _make_mech_obj() -> str:
        """
        Rough multi-part mech OBJ — torso + head + shoulder blocks.
        Used as Phase 1 stub geometry for mech-type blueprints.
        Gives svg3d something recognisably mech-shaped to render.
        """
        parts = []

        def box(cx, cy, cz, w, h, d, offset):
            """Emit box vertices + faces with index offset."""
            hw, hh, hd = w/2, h/2, d/2
            v = [
                (cx-hw, cy-hh, cz-hd), (cx+hw, cy-hh, cz-hd),
                (cx+hw, cy+hh, cz-hd), (cx-hw, cy+hh, cz-hd),
                (cx-hw, cy-hh, cz+hd), (cx+hw, cy-hh, cz+hd),
                (cx+hw, cy+hh, cz+hd), (cx-hw, cy+hh, cz+hd),
            ]
            f = [
                (1,2,3),(1,3,4),(6,5,8),(6,8,7),
                (1,2,6),(1,6,5),(4,3,7),(4,7,8),
                (1,4,8),(1,8,5),(2,3,7),(2,7,6),
            ]
            vlines = [f"v {x:.3f} {y:.3f} {z:.3f}" for x,y,z in v]
            flines = [f"f {a+offset} {b+offset} {c+offset}" for a,b,c in f]
            return vlines, flines, offset + len(v)

        all_v, all_f = [], []
        off = 1

        # Torso
        vl, fl, off = box( 0.0,  0.0,  0.0, 0.7, 0.8, 0.5, off)
        all_v += vl; all_f += fl
        # Head
        vl, fl, off = box( 0.0,  0.6,  0.0, 0.35,0.3, 0.35,off)
        all_v += vl; all_f += fl
        # Left shoulder
        vl, fl, off = box(-0.6,  0.2,  0.0, 0.35,0.3, 0.4, off)
        all_v += vl; all_f += fl
        # Right shoulder
        vl, fl, off = box( 0.6,  0.2,  0.0, 0.35,0.3, 0.4, off)
        all_v += vl; all_f += fl
        # Left upper arm
        vl, fl, off = box(-0.65,-0.15, 0.0, 0.22,0.45,0.22,off)
        all_v += vl; all_f += fl
        # Right upper arm
        vl, fl, off = box( 0.65,-0.15, 0.0, 0.22,0.45,0.22,off)
        all_v += vl; all_f += fl
        # Left forearm
        vl, fl, off = box(-0.65,-0.58, 0.0, 0.18,0.35,0.18,off)
        all_v += vl; all_f += fl
        # Right forearm
        vl, fl, off = box( 0.65,-0.58, 0.0, 0.18,0.35,0.18,off)
        all_v += vl; all_f += fl
        # Hips
        vl, fl, off = box( 0.0, -0.48, 0.0, 0.65,0.2, 0.45,off)
        all_v += vl; all_f += fl
        # Left thigh
        vl, fl, off = box(-0.25,-0.80, 0.0, 0.28,0.5, 0.28,off)
        all_v += vl; all_f += fl
        # Right thigh
        vl, fl, off = box( 0.25,-0.80, 0.0, 0.28,0.5, 0.28,off)
        all_v += vl; all_f += fl
        # Left shin
        vl, fl, off = box(-0.25,-1.22, 0.05,0.22,0.45,0.22,off)
        all_v += vl; all_f += fl
        # Right shin
        vl, fl, off = box( 0.25,-1.22, 0.05,0.22,0.45,0.22,off)
        all_v += vl; all_f += fl
        # Left foot
        vl, fl, off = box(-0.25,-1.52, 0.1, 0.28,0.14,0.42,off)
        all_v += vl; all_f += fl
        # Right foot
        vl, fl, off = box( 0.25,-1.52, 0.1, 0.28,0.14,0.42,off)
        all_v += vl; all_f += fl

        lines = ["# Iron Meridian mech placeholder geometry", ""]
        lines += all_v
        lines.append("")
        lines += all_f
        return "\n".join(lines)

    @staticmethod
    def _make_ship_obj() -> str:
        """Simplified ship hull OBJ for ship-type blueprints."""
        # Elongated hull with bridge superstructure
        parts_v, parts_f = [], []
        off = 1

        def box(cx, cy, cz, w, h, d):
            nonlocal off
            hw, hh, hd = w/2, h/2, d/2
            v = [
                (cx-hw,cy-hh,cz-hd),(cx+hw,cy-hh,cz-hd),
                (cx+hw,cy+hh,cz-hd),(cx-hw,cy+hh,cz-hd),
                (cx-hw,cy-hh,cz+hd),(cx+hw,cy-hh,cz+hd),
                (cx+hw,cy+hh,cz+hd),(cx-hw,cy+hh,cz+hd),
            ]
            f = [
                (1,2,3),(1,3,4),(6,5,8),(6,8,7),
                (1,2,6),(1,6,5),(4,3,7),(4,7,8),
                (1,4,8),(1,8,5),(2,3,7),(2,7,6),
            ]
            parts_v.extend([f"v {x:.3f} {y:.3f} {z:.3f}" for x,y,z in v])
            parts_f.extend([f"f {a+off} {b+off} {c+off}" for a,b,c in f])
            off += len(v)

        box( 0.0,  0.0, 0.0, 2.0, 0.3, 0.6)   # hull
        box( 0.0,  0.22, 0.0, 0.6, 0.18, 0.45)  # superstructure
        box( 0.0,  0.38, 0.0, 0.35,0.14, 0.3)   # bridge
        box(-0.7, -0.05, 0.0, 0.2, 0.1, 0.5)    # port engine
        box( 0.7, -0.05, 0.0, 0.2, 0.1, 0.5)    # starboard engine

        lines = ["# Iron Meridian ship placeholder geometry", ""]
        lines += parts_v
        lines.append("")
        lines += parts_f
        return "\n".join(lines)

    def _select_stub_geometry(self, brief: dict) -> str:
        """Choose the most appropriate stub geometry based on blueprint type."""
        bp_type = brief.get("type", "mech")
        if bp_type == "mech":
            return self._make_mech_obj()
        elif bp_type == "ship":
            return self._make_ship_obj()
        else:
            # Generic box for other types
            return self._make_box_obj(1.0, 1.0, 1.0)
