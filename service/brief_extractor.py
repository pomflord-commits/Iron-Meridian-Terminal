"""
Iron Meridian — Brief Extractor
================================
Sends recent chat history to Ollama and receives a structured
engineering design brief as JSON.

The brief is the single source of truth that flows through the
rest of the pipeline. The mesh model receives it. The renderer
uses it for labels and callouts. The React frontend displays it
as specs and systems.
"""

import json
import re
from typing import Optional

import httpx

# ── Default brief (fallback if extraction fails) ──────────────────────────────

FALLBACK_BRIEF = {
    "type":     "mech",
    "name":     "UNKNOWN UNIT",
    "role":     "Unclassified",
    "height":   "—",
    "weight":   "—",
    "specs":    [["STATUS", "EXTRACTION FAILED"]],
    "systems":  ["System data unavailable"],
    "design_notes": "",
}

# ── Prompt ────────────────────────────────────────────────────────────────────

BRIEF_PROMPT = """You are an engineering brief extraction system for Iron Meridian Terminal.

Analyze the conversation below and extract a structured design brief.

Conversation:
{context}

Return ONLY valid JSON. No markdown fences. No explanation. No commentary.

Schema:
{{
  "type": "mech|server|castle|ship|drone|typewriter|fantasy",
  "name": "SHORT DESIGNATION IN CAPS (max 24 chars)",
  "role": "Brief role or classification (max 40 chars)",
  "height": "Xm or —",
  "weight": "Xt or kg or —",
  "specs": [
    ["SPEC KEY", "VALUE"],
    ...up to 8 entries...
  ],
  "systems": [
    "System or feature name",
    ...up to 12 entries...
  ],
  "design_notes": "One sentence describing the primary design intent for the 3D mesh generator."
}}

Rules:
- Choose the type that best matches the conversation topic
- Extract real details mentioned in the conversation
- If a detail is not mentioned, omit it or use "—"
- Keep all strings concise
- design_notes should describe physical form, not function
- Example design_notes: "Bipedal assault mech with wide shoulder mounts, sensor mast on head, and digitigrade leg configuration"
"""


async def extract_brief(
    messages: list[dict],
    ollama_url: str,
    model: str,
    max_context_chars: int = 4000,
) -> dict:
    """
    Extract a structured engineering brief from chat history via Ollama.

    Args:
        messages:          Full chat message list [{role, content}]
        ollama_url:        Base URL of the Ollama instance
        model:             Ollama model name to use for extraction
        max_context_chars: Truncate context to this many chars

    Returns:
        Validated brief dict. Falls back to FALLBACK_BRIEF on any error.
    """
    # Build context from recent messages only — focus on substance
    recent = messages[-12:]
    context = "\n".join(
        f"{m['role'].upper()}: {m['content']}"
        for m in recent
    )[:max_context_chars]

    prompt = BRIEF_PROMPT.format(context=context)

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                f"{ollama_url}/api/chat",
                json={
                    "model":   model,
                    "stream":  False,
                    "messages": [{"role": "user", "content": prompt}],
                    "options": {"temperature": 0.05, "num_predict": 800},
                },
            )
            resp.raise_for_status()
            data = resp.json()

        raw = data.get("message", {}).get("content", "")
        brief = _parse_brief(raw)
        return _validate_brief(brief)

    except httpx.HTTPError as e:
        print(f"[brief_extractor] Ollama request failed: {e}")
        return FALLBACK_BRIEF
    except Exception as e:
        print(f"[brief_extractor] Unexpected error: {e}")
        return FALLBACK_BRIEF


def _parse_brief(raw: str) -> dict:
    """Extract JSON from the model's response, stripping any markdown fences."""
    # Strip markdown code fences
    clean = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

    # Find outermost JSON object
    match = re.search(r"\{[\s\S]*\}", clean)
    if not match:
        raise ValueError(f"No JSON object found in response: {raw[:200]}")

    return json.loads(match.group(0))


def _validate_brief(brief: dict) -> dict:
    """
    Ensure the brief has all required fields with sensible defaults.
    Prevents downstream renderers from crashing on missing keys.
    """
    valid_types = {"mech", "server", "castle", "ship", "drone", "typewriter", "fantasy"}

    return {
        "type":         brief.get("type", "mech") if brief.get("type") in valid_types else "mech",
        "name":         str(brief.get("name", "UNKNOWN"))[:24].upper(),
        "role":         str(brief.get("role", "Unclassified"))[:40],
        "height":       str(brief.get("height", "—")),
        "weight":       str(brief.get("weight", "—")),
        "specs":        _validate_specs(brief.get("specs", [])),
        "systems":      _validate_systems(brief.get("systems", [])),
        "design_notes": str(brief.get("design_notes", ""))[:200],
    }


def _validate_specs(specs) -> list:
    if not isinstance(specs, list):
        return []
    result = []
    for item in specs[:8]:
        if isinstance(item, (list, tuple)) and len(item) >= 2:
            result.append([str(item[0])[:20].upper(), str(item[1])[:24]])
        elif isinstance(item, dict):
            k = list(item.keys())[0] if item else "KEY"
            result.append([str(k)[:20].upper(), str(item.get(k, "—"))[:24]])
    return result


def _validate_systems(systems) -> list:
    if not isinstance(systems, list):
        return []
    return [str(s)[:40] for s in systems[:12] if s]
