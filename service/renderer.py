"""
Iron Meridian — Blueprint Renderer
====================================
Converts an OBJ mesh string into four SVG wireframe views using svg3d.

Pipeline:
  OBJ string → trimesh (load + repair) → svg3d (4 cameras) → 4x SVG strings

svg3d API notes (prideout/svg3d):
  - Mesh() takes an (N, 3, 3) float array — one row per face, each row is
    the three XYZ vertex positions of that face. NOT index arrays.
  - Camera() takes a pyrr view matrix and projection matrix.
  - Engine.render() writes to a filename, not a file object.
  - Shader winding: winding < 0 = front face, winding >= 0 = back face.
"""

import io
import os
import re
import tempfile
from typing import Optional

import numpy as np

try:
    import trimesh
    TRIMESH_AVAILABLE = True
except ImportError:
    TRIMESH_AVAILABLE = False
    print("[renderer] WARNING: trimesh not installed. Using fallback geometry.")

try:
    import svg3d
    import pyrr
    SVG3D_AVAILABLE = True
except ImportError:
    SVG3D_AVAILABLE = False
    print("[renderer] WARNING: svg3d/pyrr not installed. Using fallback SVG renderer.")

# ── Iron Meridian visual constants ────────────────────────────────────────────

IM_RED     = "#cc2200"
IM_RED_DIM = "#7a1500"
SVG_W      = 400
SVG_H      = 440
GRID_STEP  = 20

VIEWS = ["front", "side", "rear", "top"]

# Camera eye positions (will be scaled to mesh size)
EYE_POSITIONS = {
    "front": np.array([ 0.0,  0.0,  3.0]),
    "rear":  np.array([ 0.0,  0.0, -3.0]),
    "side":  np.array([ 3.0,  0.0,  0.0]),
    "top":   np.array([ 0.0,  3.0,  0.001]),
}

# ── Main entry point ──────────────────────────────────────────────────────────

def render_all_views(obj_string: str, brief: dict) -> dict:
    mesh = _load_mesh(obj_string)
    svgs = {}
    for view in VIEWS:
        try:
            if SVG3D_AVAILABLE and mesh is not None:
                svgs[view] = _render_view(mesh, view, brief)
            else:
                svgs[view] = _fallback_svg(view, brief)
        except Exception as e:
            print(f"[renderer] {view} render failed: {e}")
            import traceback; traceback.print_exc()
            svgs[view] = _fallback_svg(view, brief)
    return svgs

# ── Mesh loading ──────────────────────────────────────────────────────────────

def _load_mesh(obj_string: str) -> Optional[object]:
    if not TRIMESH_AVAILABLE:
        return None
    try:
        # ── Parse OBJ manually — trimesh mishandles 1-based face indices ─────
        vertices = []
        faces    = []

        for line in obj_string.splitlines():
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split()
            if parts[0] == 'v':
                vertices.append([float(parts[1]), float(parts[2]), float(parts[3])])
            elif parts[0] == 'f':
                # OBJ face indices are 1-based; strip any uv/normal refs (e.g. "1/2/3")
                idx = [int(p.split('/')[0]) for p in parts[1:]]
                # Convert negative indices
                n = len(vertices)
                idx = [i if i > 0 else n + i for i in idx]
                # Convert to 0-based
                idx = [i - 1 for i in idx]
                # Triangulate simple polygons (fan triangulation)
                for j in range(1, len(idx) - 1):
                    faces.append([idx[0], idx[j], idx[j+1]])

        if not vertices or not faces:
            raise ValueError("No geometry parsed from OBJ")

        verts_np = np.array(vertices, dtype=np.float32)
        faces_np = np.array(faces,    dtype=np.int32)

        mesh = trimesh.Trimesh(vertices=verts_np, faces=faces_np, process=False)

        if len(mesh.faces) == 0:
            raise ValueError("Mesh has no faces after construction")

        # Simplify if needed — use a ratio between 0 and 1
        if len(faces_np) > 2500:
            target_reduction = 1.0 - (2500 / len(faces_np))
            mesh = mesh.simplify_quadric_decimation(target_reduction)
            verts_np = np.array(mesh.vertices, dtype=np.float64)
            faces_np = np.array(mesh.faces, dtype=np.int32)

        # Centre and normalise using pure numpy
        centroid = (verts_np.max(axis=0) + verts_np.min(axis=0)) / 2.0
        verts_np -= centroid
        extents = verts_np.max(axis=0) - verts_np.min(axis=0)
        scale = float(extents.max())
        if scale > 0:
            verts_np /= scale

        # Clamp face indices to valid range as a safety net
        max_idx = len(verts_np) - 1
        faces_np = np.clip(faces_np, 0, max_idx)

        # Attach clean arrays directly — don't use mesh.vertices/faces after this
        mesh._clean_verts = verts_np
        mesh._clean_faces = faces_np

        print(f"[renderer] Loaded mesh: {len(verts_np)} verts, "
              f"{len(faces_np)} faces")
        return mesh

    except Exception as e:
        print(f"[renderer] Mesh load failed: {e}")
        import traceback; traceback.print_exc()
        return None

# ── svg3d rendering ───────────────────────────────────────────────────────────

def _render_view(mesh, view: str, brief: dict) -> str:
    """Render one view using the real svg3d API."""

    eye    = EYE_POSITIONS[view]
    target = np.array([0.0, 0.0, 0.0])
    up     = np.array([0.0, 1.0, 0.0])

    # pyrr matrices
    view_matrix = pyrr.matrix44.create_look_at(
        eye=eye, target=target, up=up, dtype=np.float32
    )
    proj_matrix = pyrr.matrix44.create_perspective_projection(
        fovy=45, aspect=SVG_W/SVG_H, near=0.1, far=100.0, dtype=np.float32
    )

    camera = svg3d.Camera(view_matrix, proj_matrix)

    # Use pre-cleaned numpy arrays — never read mesh.vertices/faces directly
    verts = mesh._clean_verts.astype(np.float32)
    faces = mesh._clean_faces
    face_coords = verts[faces]   # shape: (N, 3, 3)

    def shader(face_index, winding):
        if winding >= 0:
            return dict(
                fill="none",
                stroke=IM_RED_DIM,
                stroke_width="0.012",
                stroke_linejoin="round",
                opacity="0.3",
            )
        return dict(
            fill="none",
            stroke=IM_RED,
            stroke_width="0.025",
            stroke_linejoin="round",
            stroke_linecap="round",
            opacity="0.95",
        )

    svg_mesh = svg3d.Mesh(face_coords, shader)
    scene    = svg3d.Scene([svg_mesh])
    view3d   = svg3d.View(camera, scene)
    engine   = svg3d.Engine([view3d])

    # svg3d renders to a file — use a temp file then read it back
    with tempfile.NamedTemporaryFile(suffix='.svg', delete=False) as f:
        tmp_svg = f.name

    engine.render(tmp_svg)

    with open(tmp_svg) as f:
        raw_svg = f.read()
    os.unlink(tmp_svg)

    # Debug: print first 200 chars so we can see the viewBox
    print(f"[renderer] {view} SVG preview: {raw_svg[:200]}")

    return _post_process(raw_svg, view, brief)

# ── SVG post-processing ───────────────────────────────────────────────────────

def _post_process(raw_svg: str, view: str, brief: dict) -> str:
    """
    Inject Iron Meridian styling into the svg3d SVG.
    IMPORTANT: preserve svg3d's own viewBox (-0.5 -0.5 1.0 1.0).
    Replacing it with pixel coords makes the geometry invisible.
    """
    name = brief.get("name", "UNKNOWN")[:20]

    tag_match = re.search(r"(<svg[^>]*>)([\s\S]*?)</svg>", raw_svg, re.IGNORECASE)
    if not tag_match:
        return _fallback_svg(view, brief)

    svg_open = tag_match.group(1)
    inner    = tag_match.group(2)

    # Parse viewBox from svg3d output
    vb_match = re.search(r'viewBox="([^"]+)"', svg_open)
    if vb_match:
        vb = [float(x) for x in vb_match.group(1).split()]
        vx, vy, vw, vh = vb[0], vb[1], vb[2], vb[3]
    else:
        vx, vy, vw, vh = -0.5, -0.5, 1.0, 1.0

    # Grid in svg3d coordinate space
    grid_lines = []
    steps = 20
    for i in range(steps + 1):
        tx = vx + (i / steps) * vw
        ty = vy + (i / steps) * vh
        grid_lines.append(
            f'<line x1="{tx:.4f}" y1="{vy:.4f}" x2="{tx:.4f}" y2="{vy+vh:.4f}" '
            f'stroke="{IM_RED}" stroke-width="0.002" opacity="0.15"/>')
        grid_lines.append(
            f'<line x1="{vx:.4f}" y1="{ty:.4f}" x2="{vx+vw:.4f}" y2="{ty:.4f}" '
            f'stroke="{IM_RED}" stroke-width="0.002" opacity="0.15"/>')

    cs = vw * 0.05
    x0, y0, x1, y1 = vx, vy, vx+vw, vy+vh

    # Corner marks only — no text labels (panel header already shows view + name)
    decorations = f"""
    <line x1="{x0}" y1="{y0+cs}" x2="{x0}" y2="{y0}" stroke="{IM_RED}" stroke-width="0.007" opacity="0.7"/>
    <line x1="{x0}" y1="{y0}" x2="{x0+cs}" y2="{y0}" stroke="{IM_RED}" stroke-width="0.007" opacity="0.7"/>
    <line x1="{x1}" y1="{y0+cs}" x2="{x1}" y2="{y0}" stroke="{IM_RED}" stroke-width="0.007" opacity="0.7"/>
    <line x1="{x1-cs}" y1="{y0}" x2="{x1}" y2="{y0}" stroke="{IM_RED}" stroke-width="0.007" opacity="0.7"/>
    <line x1="{x0}" y1="{y1-cs}" x2="{x0}" y2="{y1}" stroke="{IM_RED}" stroke-width="0.007" opacity="0.7"/>
    <line x1="{x0}" y1="{y1}" x2="{x0+cs}" y2="{y1}" stroke="{IM_RED}" stroke-width="0.007" opacity="0.7"/>
    <line x1="{x1}" y1="{y1-cs}" x2="{x1}" y2="{y1}" stroke="{IM_RED}" stroke-width="0.007" opacity="0.7"/>
    <line x1="{x1-cs}" y1="{y1}" x2="{x1}" y2="{y1}" stroke="{IM_RED}" stroke-width="0.007" opacity="0.7"/>
    """

    # Replace fixed pixel dimensions with 100% so it scales to panel width
    svg_open = re.sub(r'width="[^"]*"', 'width="100%"', svg_open)
    svg_open = re.sub(r'height="[^"]*"', 'height="100%"', svg_open)

    holo_def = (f'<defs><radialGradient id="bp-holo-3d" cx="50%" cy="50%" r="50%">'
                f'<stop offset="0%" stop-color="{IM_RED}" stop-opacity="0.07"/>'
                f'<stop offset="100%" stop-color="{IM_RED}" stop-opacity="0"/>'
                f'</radialGradient></defs>')

    return (f'{svg_open}\n'
            f'{holo_def}\n'
            # Transparent background — overrides svg3d's default white fill
            f'<rect x="{vx}" y="{vy}" width="{vw}" height="{vh}" fill="#050505"/>\n'
            f'<rect x="{vx}" y="{vy}" width="{vw}" height="{vh}" fill="url(#bp-holo-3d)"/>\n'
            f'{"".join(grid_lines)}\n'
            f'{inner}\n'
            f'{decorations}\n'
            f'</svg>')

# ── Fallback SVG ──────────────────────────────────────────────────────────────

def _fallback_svg(view: str, brief: dict) -> str:
    name = brief.get("name", "UNKNOWN")
    w, h = SVG_W, SVG_H
    cx, cy = w//2, h//2
    iso = {"front":0,"side":30,"rear":0,"top":60}
    off = iso.get(view, 0)
    bw, bh = 160, 200
    x0, y0 = cx-bw//2, cy-bh//2
    x1, y1 = cx+bw//2, cy+bh//2
    inner = f"""
    <rect x="{x0}" y="{y0}" width="{bw}" height="{bh}"
          fill="none" stroke="{IM_RED}" stroke-width="1.2" opacity="0.6"/>
    <line x1="{x0}" y1="{y0}" x2="{x0+off}" y2="{y0-off//2}"
          stroke="{IM_RED}" stroke-width="0.8" opacity="0.4"/>
    <line x1="{x1}" y1="{y0}" x2="{x1+off}" y2="{y0-off//2}"
          stroke="{IM_RED}" stroke-width="0.8" opacity="0.4"/>
    <line x1="{x1}" y1="{y1}" x2="{x1+off}" y2="{y1-off//2}"
          stroke="{IM_RED}" stroke-width="0.8" opacity="0.4"/>
    <line x1="{x0+off}" y1="{y0-off//2}" x2="{x1+off}" y2="{y0-off//2}"
          stroke="{IM_RED}" stroke-width="0.8" opacity="0.4"/>
    <line x1="{x1+off}" y1="{y0-off//2}" x2="{x1+off}" y2="{y1-off//2}"
          stroke="{IM_RED}" stroke-width="0.8" opacity="0.4"/>
    <text x="{cx}" y="{cy-8}" fill="{IM_RED}" font-family="monospace"
          font-size="11" text-anchor="middle" opacity="0.5">GENERATING</text>
    <text x="{cx}" y="{cy+8}" fill="{IM_RED}" font-family="monospace"
          font-size="11" text-anchor="middle" opacity="0.5">MESH...</text>
    """
    return f"""<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" fill="none">
  {_defs()}
  <rect width="{w}" height="{h}" fill="url(#bp-holo-3d)"/>
  {_grid(w, h)}
  {inner}
  {_labels(view, name, w, h)}
</svg>"""

# ── SVG helpers ───────────────────────────────────────────────────────────────

def _defs() -> str:
    return f"""<defs>
    <radialGradient id="bp-holo-3d" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="{IM_RED}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="{IM_RED}" stop-opacity="0"/>
    </radialGradient>
  </defs>"""

def _grid(w: int, h: int) -> str:
    lines = []
    for i in range(0, h, GRID_STEP):
        lines.append(f'<line x1="0" y1="{i}" x2="{w}" y2="{i}" '
                     f'stroke="{IM_RED}" stroke-width="0.15" opacity="0.18"/>')
    for i in range(0, w, GRID_STEP):
        lines.append(f'<line x1="{i}" y1="0" x2="{i}" y2="{h}" '
                     f'stroke="{IM_RED}" stroke-width="0.15" opacity="0.18"/>')
    return "\n  ".join(lines)

def _labels(view: str, name: str, w: int, h: int) -> str:
    c = 10
    return f"""
    <line x1="0" y1="{c}" x2="0" y2="0" stroke="{IM_RED}" stroke-width="1" opacity="0.6"/>
    <line x1="0" y1="0" x2="{c}" y2="0" stroke="{IM_RED}" stroke-width="1" opacity="0.6"/>
    <line x1="{w}" y1="{c}" x2="{w}" y2="0" stroke="{IM_RED}" stroke-width="1" opacity="0.6"/>
    <line x1="{w-c}" y1="0" x2="{w}" y2="0" stroke="{IM_RED}" stroke-width="1" opacity="0.6"/>
    <line x1="0" y1="{h-c}" x2="0" y2="{h}" stroke="{IM_RED}" stroke-width="1" opacity="0.6"/>
    <line x1="0" y1="{h}" x2="{c}" y2="{h}" stroke="{IM_RED}" stroke-width="1" opacity="0.6"/>
    <line x1="{w}" y1="{h-c}" x2="{w}" y2="{h}" stroke="{IM_RED}" stroke-width="1" opacity="0.6"/>
    <line x1="{w-c}" y1="{h}" x2="{w}" y2="{h}" stroke="{IM_RED}" stroke-width="1" opacity="0.6"/>
    <text x="8" y="14" fill="{IM_RED}" font-family="monospace" font-size="9"
          letter-spacing="0.15em" opacity="0.7">// {view.upper()}</text>
    <text x="{w-8}" y="14" fill="{IM_RED}" font-family="monospace" font-size="9"
          letter-spacing="0.1em" text-anchor="end" opacity="0.55">{name}</text>
    <line x1="{w-6}" y1="20" x2="{w-6}" y2="{h-20}"
          stroke="{IM_RED}" stroke-width="0.5" opacity="0.4"/>
    <line x1="{w-10}" y1="20" x2="{w-2}" y2="20"
          stroke="{IM_RED}" stroke-width="0.5" opacity="0.4"/>
    <line x1="{w-10}" y1="{h-20}" x2="{w-2}" y2="{h-20}"
          stroke="{IM_RED}" stroke-width="0.5" opacity="0.4"/>
    """
