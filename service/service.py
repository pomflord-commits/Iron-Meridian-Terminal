"""
Iron Meridian — Blueprint Orchestration Service
================================================
FastAPI server that manages the full blueprint generation pipeline.

Pipeline (Phase 2):
  Chat History → Brief Extraction (Ollama) → Image Generation (SDXL)
              → Mesh Generation (TripoSR) → svg3d Render → SVG

To run:
  pip install fastapi uvicorn httpx trimesh numpy svg3d
  python service.py

Listens on: http://localhost:8765
"""

import asyncio
import hashlib
import json
import os
import time
import traceback
import uuid
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from brief_extractor import extract_brief
from renderer import render_all_views
from image_generator import generate_concept_image
from mesh_models.base import MeshModel
from mesh_models.shap_e import ShapEModel
from mesh_models.triposr import TripoSRModel
from mesh_models.instantmesh import InstantMeshModel
from mesh_models.openlrm import OpenLRMModel

# ── Config ────────────────────────────────────────────────────────────────────

SERVICE_PORT   = 8765
OLLAMA_URL     = "http://localhost:11434"
CACHE_DIR      = Path(__file__).parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)

# ── Mesh model registry ───────────────────────────────────────────────────────
# Adding a new model: create a class in mesh_models/, register it here.

MESH_MODELS: dict[str, MeshModel] = {
    "shap-e":      ShapEModel(),
    "triposr":     TripoSRModel(),
    "instantmesh": InstantMeshModel(),
    "openlrm":     OpenLRMModel(),
}

DEFAULT_MESH_MODEL = "instantmesh"

# ── Job store (in-memory; survives only for the session) ─────────────────────
# Structure: { job_id: { status, stage, progress, error, result, chat_id, brief_hash } }

jobs: dict[str, dict] = {}

# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(title="Iron Meridian Blueprint Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Vite dev server + production build
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request / Response models ─────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    chat_id: str
    messages: list[dict]          # [{role, content}]
    ollama_model: str = "llama3"
    mesh_model: str = DEFAULT_MESH_MODEL

class JobStatus(BaseModel):
    job_id: str
    status: str                   # queued | running | done | failed
    stage: str                    # brief | mesh | render | complete | failed
    progress: int                 # 0-100
    error: Optional[str] = None
    has_result: bool = False

class JobResult(BaseModel):
    job_id: str
    chat_id: str
    brief: dict
    svgs: dict                    # { front, side, rear, top }
    mesh_model_used: str
    generated_at: float

# ── Helpers ───────────────────────────────────────────────────────────────────

def brief_hash(messages: list[dict]) -> str:
    """Hash recent messages to detect whether regeneration is needed."""
    content = "".join(m.get("content","") for m in messages[-8:])
    return hashlib.sha256(content.encode()).hexdigest()[:16]

def cache_path(chat_id: str) -> Path:
    p = CACHE_DIR / chat_id
    p.mkdir(exist_ok=True)
    return p

def load_cached_result(chat_id: str, b_hash: str) -> Optional[dict]:
    """Return cached result if the brief hash matches, else None."""
    meta_file = cache_path(chat_id) / "meta.json"
    if not meta_file.exists():
        return None
    try:
        meta = json.loads(meta_file.read_text())
        if meta.get("brief_hash") != b_hash:
            return None
        # Load SVG files
        svgs = {}
        for view in ("front", "side", "rear", "top"):
            svg_file = cache_path(chat_id) / f"{view}.svg"
            if svg_file.exists():
                svgs[view] = svg_file.read_text()
        if len(svgs) < 4:
            return None
        return {
            "brief":           meta["brief"],
            "svgs":            svgs,
            "mesh_model_used": meta.get("mesh_model_used", "cached"),
            "generated_at":    meta.get("generated_at", 0),
        }
    except Exception:
        return None

def save_cached_result(chat_id: str, b_hash: str, brief: dict,
                       svgs: dict, mesh_model: str):
    """Persist SVGs and metadata to disk."""
    base = cache_path(chat_id)
    for view, svg in svgs.items():
        (base / f"{view}.svg").write_text(svg)
    meta = {
        "brief_hash":      b_hash,
        "brief":           brief,
        "mesh_model_used": mesh_model,
        "generated_at":    time.time(),
    }
    (base / "meta.json").write_text(json.dumps(meta, indent=2))

def update_job(job_id: str, **kwargs):
    if job_id in jobs:
        jobs[job_id].update(kwargs)

# ── Background pipeline ───────────────────────────────────────────────────────

async def run_pipeline(job_id: str, req: GenerateRequest):
    """
    Full async pipeline. Runs in the background after the POST returns.

    Stages:
      1. brief   — Ollama extracts engineering brief from chat history
      2. mesh    — Selected mesh model generates OBJ geometry
      3. render  — svg3d renders 4 camera views to SVG
    """
    chat_id    = req.chat_id
    b_hash     = brief_hash(req.messages)

    try:
        # ── Check cache first ────────────────────────────────────────────────
        cached = load_cached_result(chat_id, b_hash)
        if cached:
            update_job(job_id,
                status="done", stage="complete", progress=100,
                has_result=True,
                result={**cached, "job_id": job_id, "chat_id": chat_id},
            )
            return

        # ── Stage 1: Extract brief ───────────────────────────────────────────
        update_job(job_id, status="running", stage="brief", progress=10)

        brief = await extract_brief(
            messages=req.messages,
            ollama_url=OLLAMA_URL,
            model=req.ollama_model,
        )
        update_job(job_id, stage="brief", progress=30)

        # ── Stage 2: Generate concept image ─────────────────────────────────
        update_job(job_id, stage="image", progress=32)

        concept_image_path = str(cache_path(chat_id) / "concept.png")
        loop = asyncio.get_event_loop()
        generated_image = await loop.run_in_executor(
            None, generate_concept_image, brief, concept_image_path
        )

        # Attach image path to brief so mesh model can use it
        if generated_image:
            brief["_concept_image_path"] = generated_image
            update_job(job_id, stage="image", progress=50,
                       concept_image=concept_image_path)
        else:
            update_job(job_id, stage="image", progress=50)

        # ── Stage 3: Generate mesh ───────────────────────────────────────────
        update_job(job_id, stage="mesh", progress=52)

        model_key = req.mesh_model if req.mesh_model in MESH_MODELS else DEFAULT_MESH_MODEL
        mesh_model = MESH_MODELS[model_key]

        # Mesh generation may be slow — run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        obj_string = await loop.run_in_executor(
            None, mesh_model.generate, brief
        )
        update_job(job_id, stage="mesh", progress=70)

        # ── Stage 3: Render SVGs ─────────────────────────────────────────────
        update_job(job_id, stage="render", progress=75)

        svgs = await loop.run_in_executor(
            None, render_all_views, obj_string, brief
        )
        update_job(job_id, stage="render", progress=95)

        # ── Save to cache ────────────────────────────────────────────────────
        save_cached_result(chat_id, b_hash, brief, svgs, model_key)

        result = {
            "job_id":          job_id,
            "chat_id":         chat_id,
            "brief":           brief,
            "svgs":            svgs,
            "mesh_model_used": model_key,
            "generated_at":    time.time(),
        }
        update_job(job_id,
            status="done", stage="complete", progress=100,
            has_result=True, result=result,
        )

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[pipeline] Job {job_id} failed: {e}\n{tb}")
        update_job(job_id,
            status="failed", stage="failed", progress=0,
            error=str(e), has_result=False,
        )

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Quick health check — React polls this to show SERVICE ONLINE/OFFLINE."""
    available_models = {k: v.is_available() for k, v in MESH_MODELS.items()}
    return {
        "status":   "online",
        "version":  "1.0.0",
        "models":   available_models,
    }


@app.post("/blueprint/generate")
async def generate(req: GenerateRequest):
    """
    Start a blueprint generation job.
    Returns immediately with a job_id.
    Client polls /blueprint/status/:id for progress.
    """
    # Check cache synchronously before spawning a job
    b_hash = brief_hash(req.messages)
    cached = load_cached_result(req.chat_id, b_hash)

    job_id = str(uuid.uuid4())

    if cached:
        # Cache hit — resolve immediately, no background task needed
        jobs[job_id] = {
            "status":     "done",
            "stage":      "complete",
            "progress":   100,
            "error":      None,
            "has_result": True,
            "result": {
                **cached,
                "job_id":  job_id,
                "chat_id": req.chat_id,
            },
        }
    else:
        # Queue the job
        jobs[job_id] = {
            "status":     "queued",
            "stage":      "brief",
            "progress":   0,
            "error":      None,
            "has_result": False,
            "result":     None,
        }
        asyncio.create_task(run_pipeline(job_id, req))

    return {"job_id": job_id, "cached": cached is not None}


@app.get("/blueprint/status/{job_id}", response_model=JobStatus)
async def status(job_id: str):
    """Poll job progress. Returns stage + progress 0-100."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    j = jobs[job_id]
    return JobStatus(
        job_id=job_id,
        status=j["status"],
        stage=j["stage"],
        progress=j["progress"],
        error=j.get("error"),
        has_result=j.get("has_result", False),
    )


@app.get("/blueprint/result/{job_id}")
async def result(job_id: str):
    """Fetch completed job result (SVGs + brief)."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    j = jobs[job_id]
    if j["status"] != "done" or not j.get("has_result"):
        raise HTTPException(status_code=202, detail="Job not complete")
    return JSONResponse(content=j["result"])


@app.delete("/blueprint/{chat_id}")
async def clear_cache(chat_id: str):
    """Clear cached blueprint for a chat (forces regeneration)."""
    import shutil
    p = cache_path(chat_id)
    if p.exists():
        shutil.rmtree(p)
        p.mkdir(exist_ok=True)
    # Also remove any in-memory jobs for this chat
    to_remove = [jid for jid, j in jobs.items()
                 if j.get("result", {}) and j["result"].get("chat_id") == chat_id]
    for jid in to_remove:
        del jobs[jid]
    return {"cleared": True, "chat_id": chat_id}


@app.get("/blueprint/cached/{chat_id}")
async def check_cache(chat_id: str, brief_hash_val: str = ""):
    """Check whether a valid cache exists for a chat."""
    if not brief_hash_val:
        return {"cached": False}
    cached = load_cached_result(chat_id, brief_hash_val)
    return {"cached": cached is not None}


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Iron Meridian Blueprint Service v1.0.0")
    print(f"Listening on http://localhost:{SERVICE_PORT}")
    print(f"Cache directory: {CACHE_DIR.resolve()}")
    print()
    print("Mesh models available:")
    for k, v in MESH_MODELS.items():
        status_str = "AVAILABLE" if v.is_available() else "NOT INSTALLED"
        print(f"  {k:15s} {status_str}")
    print()
    uvicorn.run("service:app", host="0.0.0.0", port=SERVICE_PORT, reload=False)
