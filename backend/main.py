"""GlucoLog API — FastAPI backend over PGlite (Postgres wire protocol)."""

import json
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import ai
from db import db
from schema import init_db

TARGET_LOW = 70.0
TARGET_HIGH = 180.0
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    await init_db()
    yield
    await db.close()


app = FastAPI(title="GlucoLog API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _check_image(file: UploadFile):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(415, f"Unsupported image type {file.content_type}")


def _ai_error(e: Exception) -> HTTPException:
    if isinstance(e, RuntimeError):  # missing API key
        return HTTPException(503, str(e))
    return HTTPException(502, f"AI analysis failed: {e}")


# ---------------------------------------------------------------- readings

class ReadingIn(BaseModel):
    value_mg_dl: float
    taken_at: datetime | None = None
    note: str | None = None
    source: str = "manual"


@app.get("/api/readings")
async def list_readings(days: int = 30, limit: int = 500):
    return await db.fetch(
        """SELECT * FROM readings
           WHERE taken_at >= now() - make_interval(days => %s)
           ORDER BY taken_at DESC LIMIT %s""",
        (days, limit),
    )


@app.post("/api/readings", status_code=201)
async def create_reading(body: ReadingIn):
    taken = body.taken_at or datetime.now()
    rows = await db.fetch(
        """INSERT INTO readings (value_mg_dl, taken_at, source, note)
           VALUES (%s,%s,%s,%s) RETURNING *""",
        (body.value_mg_dl, taken, body.source, body.note),
    )
    return rows[0]


@app.delete("/api/readings/{reading_id}", status_code=204)
async def delete_reading(reading_id: int):
    await db.execute("DELETE FROM readings WHERE id = %s", (reading_id,))


@app.post("/api/readings/photo")
async def reading_from_photo(photo: UploadFile = File(...)):
    """OCR a glucometer photo. Returns the parsed reading for user confirmation
    plus the saved row if a value was found."""
    _check_image(photo)
    data = await photo.read()
    try:
        parsed = await ai.read_glucometer(
            data, photo.content_type, datetime.now().isoformat(timespec="minutes")
        )
    except Exception as e:
        raise _ai_error(e)

    if parsed.value is None:
        return {"saved": None, "parsed": parsed.model_dump()}

    value = parsed.value * 18.0 if parsed.unit == "mmol/L" else parsed.value
    taken_at = datetime.now()
    if parsed.iso_datetime:
        try:
            taken_at = datetime.fromisoformat(parsed.iso_datetime)
        except ValueError:
            pass

    note_bits = [b for b in [
        f"meter showed {parsed.display_date or ''} {parsed.display_time or ''}".strip(),
        parsed.notes,
    ] if b]
    rows = await db.fetch(
        """INSERT INTO readings (value_mg_dl, taken_at, source, note)
           VALUES (%s,%s,'photo',%s) RETURNING *""",
        (round(value, 1), taken_at, " — ".join(note_bits) or None),
    )
    return {"saved": rows[0], "parsed": parsed.model_dump()}


# ------------------------------------------------------------------- meals

class MealIn(BaseModel):
    name: str
    eaten_at: datetime | None = None
    source: str = "text"
    calories: float | None = None
    carbs_g: float | None = None
    sugar_g: float | None = None
    fiber_g: float | None = None
    protein_g: float | None = None
    fat_g: float | None = None
    glycemic_impact: str | None = None
    tip: str | None = None
    items: list[dict] = []


@app.get("/api/meals")
async def list_meals(days: int = 30, limit: int = 200):
    return await db.fetch(
        """SELECT * FROM meals
           WHERE eaten_at >= now() - make_interval(days => %s)
           ORDER BY eaten_at DESC LIMIT %s""",
        (days, limit),
    )


@app.post("/api/meals", status_code=201)
async def create_meal(body: MealIn):
    rows = await db.fetch(
        """INSERT INTO meals (name, eaten_at, source, calories, carbs_g, sugar_g,
                              fiber_g, protein_g, fat_g, glycemic_impact, tip, items)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
        (
            body.name, body.eaten_at or datetime.now(), body.source, body.calories,
            body.carbs_g, body.sugar_g, body.fiber_g, body.protein_g, body.fat_g,
            body.glycemic_impact, body.tip, json.dumps(body.items),
        ),
    )
    return rows[0]


@app.delete("/api/meals/{meal_id}", status_code=204)
async def delete_meal(meal_id: int):
    await db.execute("DELETE FROM meals WHERE id = %s", (meal_id,))


@app.post("/api/meals/analyze")
async def analyze_meal(
    description: str | None = Form(None),
    photo: UploadFile | None = File(None),
):
    """Estimate macros from a text description and/or a photo of the meal.
    Returns the analysis only — the client saves via POST /api/meals."""
    try:
        if photo is not None:
            _check_image(photo)
            data = await photo.read()
            analysis = await ai.analyze_meal_photo(data, photo.content_type, description)
        elif description:
            analysis = await ai.analyze_meal_text(description)
        else:
            raise HTTPException(422, "Provide a description, a photo, or both.")
    except HTTPException:
        raise
    except Exception as e:
        raise _ai_error(e)
    return analysis.model_dump()


# ------------------------------------------------------------------- stats

@app.get("/api/stats/summary")
async def stats_summary(days: int = 14):
    rows = await db.fetch(
        """SELECT value_mg_dl, taken_at FROM readings
           WHERE taken_at >= now() - make_interval(days => %s)
           ORDER BY taken_at""",
        (days,),
    )
    values = [r["value_mg_dl"] for r in rows]
    n = len(values)
    avg = sum(values) / n if n else None
    in_range = sum(1 for v in values if TARGET_LOW <= v <= TARGET_HIGH)
    lows = sum(1 for v in values if v < TARGET_LOW)
    highs = sum(1 for v in values if v > TARGET_HIGH)

    latest = await db.fetchone(
        "SELECT * FROM readings ORDER BY taken_at DESC LIMIT 1"
    )

    # week-over-week average delta
    now = datetime.now()
    this_week = [r["value_mg_dl"] for r in rows if r["taken_at"] >= now - timedelta(days=7)]
    prior_week = [
        r["value_mg_dl"] for r in rows
        if now - timedelta(days=14) <= r["taken_at"] < now - timedelta(days=7)
    ]
    delta = None
    if this_week and prior_week:
        delta = sum(this_week) / len(this_week) - sum(prior_week) / len(prior_week)

    return {
        "count": n,
        "avg_mg_dl": round(avg, 1) if avg else None,
        # eA1C from mean glucose (ADAG formula)
        "est_a1c": round((avg + 46.7) / 28.7, 1) if avg else None,
        "time_in_range_pct": round(100 * in_range / n, 1) if n else None,
        "low_pct": round(100 * lows / n, 1) if n else None,
        "high_pct": round(100 * highs / n, 1) if n else None,
        "latest": latest,
        "week_delta": round(delta, 1) if delta is not None else None,
        "target": {"low": TARGET_LOW, "high": TARGET_HIGH},
    }


@app.get("/api/stats/series")
async def stats_series(days: int = 14):
    readings = await db.fetch(
        """SELECT value_mg_dl, taken_at FROM readings
           WHERE taken_at >= now() - make_interval(days => %s)
           ORDER BY taken_at""",
        (days,),
    )
    daily = await db.fetch(
        """SELECT date_trunc('day', taken_at)::date::text AS day,
                  round(avg(value_mg_dl)::numeric, 1)::float AS avg,
                  min(value_mg_dl) AS min, max(value_mg_dl) AS max,
                  count(*) AS n
           FROM readings
           WHERE taken_at >= now() - make_interval(days => %s)
           GROUP BY 1 ORDER BY 1""",
        (days,),
    )
    macros = await db.fetch(
        """SELECT date_trunc('day', eaten_at)::date::text AS day,
                  round(sum(carbs_g)::numeric, 0)::float AS carbs_g,
                  round(sum(protein_g)::numeric, 0)::float AS protein_g,
                  round(sum(fat_g)::numeric, 0)::float AS fat_g,
                  round(sum(sugar_g)::numeric, 0)::float AS sugar_g,
                  round(sum(fiber_g)::numeric, 0)::float AS fiber_g
           FROM meals
           WHERE eaten_at >= now() - make_interval(days => %s)
           GROUP BY 1 ORDER BY 1""",
        (days,),
    )
    return {"readings": readings, "daily": daily, "macros": macros}


# ----------------------------------------------------------------- recipes

@app.get("/api/recipes")
async def list_recipes(q: str | None = None, tag: str | None = None):
    sql = "SELECT * FROM recipes"
    clauses, params = [], []
    if q:
        clauses.append("(title ILIKE %s OR description ILIKE %s OR ingredients::text ILIKE %s)")
        like = f"%{q}%"
        params += [like, like, like]
    if tag:
        clauses.append("%s = ANY(tags)")
        params.append(tag)
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY title"
    return await db.fetch(sql, params or None)


@app.get("/api/recipes/tags")
async def recipe_tags():
    rows = await db.fetch("SELECT DISTINCT unnest(tags) AS tag FROM recipes ORDER BY 1")
    return [r["tag"] for r in rows]


# ---------------------------------------------------------------- shopping

class ShoppingFromRecipes(BaseModel):
    recipe_ids: list[int]


class ShoppingItemIn(BaseModel):
    name: str
    quantity: str | None = None
    category: str = "Pantry"


class ShoppingItemPatch(BaseModel):
    checked: bool


@app.get("/api/shopping")
async def list_shopping():
    return await db.fetch(
        "SELECT * FROM shopping_items ORDER BY checked, category, name"
    )


@app.post("/api/shopping/from-recipes", status_code=201)
async def shopping_from_recipes(body: ShoppingFromRecipes):
    if not body.recipe_ids:
        raise HTTPException(422, "Select at least one recipe.")
    recipes = await db.fetch(
        "SELECT title, ingredients FROM recipes WHERE id = ANY(%s)", (body.recipe_ids,)
    )
    existing = await db.fetch(
        "SELECT lower(name) AS name FROM shopping_items WHERE NOT checked"
    )
    have = {r["name"] for r in existing}
    added = 0
    for r in recipes:
        ingredients = r["ingredients"]
        if isinstance(ingredients, str):
            ingredients = json.loads(ingredients)
        for ing in ingredients:
            if ing["name"].lower() in have:
                continue
            have.add(ing["name"].lower())
            await db.execute(
                """INSERT INTO shopping_items (name, quantity, category, recipe_title)
                   VALUES (%s,%s,%s,%s)""",
                (ing["name"], ing.get("qty"), ing.get("category", "Pantry"), r["title"]),
            )
            added += 1
    return {"added": added}


@app.post("/api/shopping", status_code=201)
async def add_shopping_item(body: ShoppingItemIn):
    rows = await db.fetch(
        """INSERT INTO shopping_items (name, quantity, category)
           VALUES (%s,%s,%s) RETURNING *""",
        (body.name, body.quantity, body.category),
    )
    return rows[0]


@app.patch("/api/shopping/{item_id}")
async def toggle_shopping_item(item_id: int, body: ShoppingItemPatch):
    rows = await db.fetch(
        "UPDATE shopping_items SET checked = %s WHERE id = %s RETURNING *",
        (body.checked, item_id),
    )
    if not rows:
        raise HTTPException(404, "Item not found")
    return rows[0]


@app.delete("/api/shopping/{item_id}", status_code=204)
async def delete_shopping_item(item_id: int):
    await db.execute("DELETE FROM shopping_items WHERE id = %s", (item_id,))


@app.delete("/api/shopping", status_code=204)
async def clear_checked():
    await db.execute("DELETE FROM shopping_items WHERE checked")


@app.get("/api/health")
async def health():
    import settings
    vision = settings.vision_status()
    return {
        "ok": True,
        "ai_configured": vision["configured"],
        "vision_provider": vision["provider"],
        "vision_model": vision["model"],
        "vision_detail": vision["detail"],
        "db_pooled": settings.DB_MAX_CONNECTIONS > 1,
    }
