"""Central configuration. Reads backend/.env (if present) then the environment.

See backend/.env.example for all options.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

# ── Database ──────────────────────────────────────────────────────────
# Default: the PGlite sidecar. Point at any real Postgres to switch.
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@127.0.0.1:5332/postgres?sslmode=disable",
)

# PGlite accepts exactly one client — keep this at 1 for it.
# For real Postgres, raise it (e.g. 10) to get a connection pool.
DB_MAX_CONNECTIONS = int(os.environ.get("DB_MAX_CONNECTIONS", "1"))

# ── API ───────────────────────────────────────────────────────────────
# Comma-separated list of origins allowed to call the API from a browser.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

# ── Vision / AI ───────────────────────────────────────────────────────
# "anthropic" (default) or "openai" (any OpenAI-compatible endpoint:
# OpenAI itself, Ollama, LM Studio, llama.cpp server, vLLM, OpenRouter…)
VISION_PROVIDER = os.environ.get("VISION_PROVIDER", "anthropic").lower()

_DEFAULT_MODELS = {
    "anthropic": "claude-opus-4-8",
    "openai": "gpt-4o-mini",
}
VISION_MODEL = os.environ.get("VISION_MODEL") or _DEFAULT_MODELS.get(VISION_PROVIDER, "")

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

OPENAI_BASE_URL = os.environ.get("OPENAI_BASE_URL", "")  # e.g. http://localhost:11434/v1
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")    # dummy value is fine for local servers


def vision_status() -> dict:
    """Whether the configured vision provider is usable, for /api/health."""
    if VISION_PROVIDER == "anthropic":
        ok = bool(ANTHROPIC_API_KEY)
        detail = None if ok else "ANTHROPIC_API_KEY is not set"
    elif VISION_PROVIDER == "openai":
        ok = bool(OPENAI_BASE_URL or OPENAI_API_KEY)
        detail = None if ok else "Set OPENAI_BASE_URL (local) and/or OPENAI_API_KEY"
    else:
        ok, detail = False, f"Unknown VISION_PROVIDER {VISION_PROVIDER!r} (use 'anthropic' or 'openai')"
    return {
        "configured": ok,
        "provider": VISION_PROVIDER,
        "model": VISION_MODEL,
        "detail": detail,
    }
