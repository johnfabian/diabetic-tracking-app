# GlucoLog 🩸

Personal glucose + meal tracking for diabetics. Snap a photo of your glucometer
and the reading is logged with the date/time shown on the meter's screen.
Describe (or photograph) what you ate and get carbs, sugar, protein, fat, fiber
and a glycemic-impact rating. Charts, recipes, and an auto-built shopping list
round it out.

## Quick start

Requires [pnpm](https://pnpm.io) (`npm i -g pnpm` or `corepack enable`), Node 20+,
and Python 3.11+.

```sh
pnpm setup:app       # one time: installs all JS + Python dependencies
pnpm start           # starts everything → open http://localhost:5173
```

For the AI photo features, copy `backend/.env.example` to `backend/.env` and set
your provider credentials (see Configuration below). Everything else — manual
logging, charts, recipes, shopping list — works without any configuration.

`pnpm start` runs all three processes with one command:

| Process | What                                          | Port |
|---------|-----------------------------------------------|------|
| `db`    | PGlite Postgres socket server (skippable — see Configuration) | 5332 |
| `api`   | FastAPI backend                               | 8000 |
| `web`   | Vite + React frontend                         | 5173 |

If one process dies the others shut down too, so a single Ctrl+C always leaves
a clean slate. (`pnpm dev` is an alias for `pnpm start`; `pnpm dev:db`,
`pnpm dev:api`, `pnpm dev:web` start the pieces individually.)

The app opens on an animated welcome page; **Start tracking** takes you to the
dashboard at `/dashboard`. The layout is responsive — sidebar navigation on
desktop, a bottom tab bar on phones.

## Tests

```bash
pnpm test            # backend (pytest) + frontend (vitest)
pnpm test:api        # FastAPI endpoints against a throwaway PGlite instance
pnpm test:web        # form actions, components and helpers (jsdom)
```

The backend suite spawns its own PGlite server on port 55432 with a temp data
directory — it never touches `db/data/`.

## Features

- 📷 **Photograph your glucometer** — the value *and the date/time shown on the
  meter's display* are extracted and logged automatically (mmol/L is converted
  to mg/dL; low-confidence reads are flagged so you can double-check).
- 🍽 **Meal analysis** — describe what you ate, photograph the plate, or both;
  get per-item and total calories, carbs, sugar, fiber, protein and fat, a
  glycemic-impact rating, and one practical tip. One click logs it.
- 📊 **Dashboard** — glucose trend with the 70–180 mg/dL target band shaded,
  time-in-range donut, estimated A1C (ADAG formula), week-over-week average
  delta, and daily macro bars from your logged meals.
- 📖 **Recipes** — searchable, tag-filterable diabetic-friendly recipes with
  per-serving macros (seeded automatically on first boot).
- 🛒 **Shopping list** — select recipes and a deduplicated list grouped by store
  section (Produce / Protein / Dairy / Frozen / Pantry) is built for you, with
  check-off and manual add.

## Configuration (`backend/.env`)

Both the database and the vision AI are swappable. Copy `backend/.env.example`
to `backend/.env` — every option is documented there with working examples.

### Database

Defaults to the bundled PGlite database (a WASM Postgres persisted to
`db/data/` — zero install). To use a real Postgres (local, Docker, Supabase,
RDS…):

```ini
DATABASE_URL=postgresql://user:password@localhost:5432/glucolog
DB_MAX_CONNECTIONS=10        # >1 enables a real connection pool
```

The schema auto-creates and recipes auto-seed against any empty database, so
switching is just the DSN — no migrations to run. Notes:

- Keep `DB_MAX_CONNECTIONS=1` (the default) while on PGlite — it accepts a
  single client connection.
- On a real Postgres the PGlite sidecar is unnecessary: run `pnpm dev:api`
  and `pnpm dev:web` instead of `pnpm start`.

### Vision AI

Defaults to Anthropic Claude (`claude-opus-4-8`). Options:

```ini
# Anthropic (default) — switch to a cheaper model:
ANTHROPIC_API_KEY=sk-ant-...
VISION_MODEL=claude-haiku-4-5

# …or any OpenAI-compatible endpoint. Local Ollama (free, private):
VISION_PROVIDER=openai
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
VISION_MODEL=qwen2.5vl:7b

# …or a cheap hosted model via OpenRouter:
VISION_PROVIDER=openai
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-...
VISION_MODEL=google/gemini-2.0-flash-001
```

Both providers validate responses against the same schemas, so the app behaves
identically — accuracy of the estimates is the only thing that changes when you
trade down. The sidebar shows which provider is active, and
`GET /api/health` reports provider, model, and what's missing if misconfigured.

## Architecture

- **Frontend** — React 19 + React Router v7 in data mode (loaders/actions),
  recharts for the graphs. Vite dev server proxies `/api` to the backend.
- **Backend** — FastAPI. DB access is sync psycopg run in threads (async
  psycopg can't run on Windows' default event loop), one locked connection for
  PGlite or a psycopg pool for real Postgres.
- **Database** — PGlite exposed over the real Postgres wire protocol by a small
  Node sidecar (`db/server.mjs`), or any Postgres you point `DATABASE_URL` at.
- **AI** — provider-abstracted vision module (`backend/ai.py`): Anthropic SDK
  with schema-validated parsing, or any OpenAI-compatible endpoint with JSON
  mode + the same Pydantic validation.

## Notes

- Delete `db/data/` to reset the PGlite database (recipes re-seed on next boot).
- Targets are 70–180 mg/dL (standard time-in-range). Change `TARGET_LOW` /
  `TARGET_HIGH` in `backend/main.py` if your care team uses different numbers.
- This is a tracking aid, **not medical advice**.
