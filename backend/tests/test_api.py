"""API tests for every form-backed endpoint, run against a real PGlite DB."""


# ── health ──────────────────────────────────────────────────────────────

def test_health(client):
    body = client.get("/api/health").json()
    assert body["ok"] is True
    assert body["ai_configured"] is False
    assert body["db_pooled"] is False


# ── readings (manual entry form) ────────────────────────────────────────

def test_create_reading_with_local_datetime_keeps_wall_clock(client):
    # the frontend sends the datetime-local value as-is — the stored
    # timestamp must keep the same wall-clock time, not shift by tz offset
    r = client.post("/api/readings", json={
        "value_mg_dl": 118, "taken_at": "2026-06-11T14:30", "note": "after lunch",
    })
    assert r.status_code == 201
    row = r.json()
    assert row["value_mg_dl"] == 118.0
    assert row["taken_at"].startswith("2026-06-11T14:30")
    assert row["source"] == "manual"
    assert row["note"] == "after lunch"
    client.delete(f"/api/readings/{row['id']}")


def test_create_reading_without_date_defaults_to_now(client):
    r = client.post("/api/readings", json={"value_mg_dl": 95, "taken_at": None})
    assert r.status_code == 201
    row = r.json()
    assert row["taken_at"] is not None
    client.delete(f"/api/readings/{row['id']}")


def test_create_reading_rejects_garbage_date(client):
    r = client.post("/api/readings", json={"value_mg_dl": 100, "taken_at": "yesterday-ish"})
    assert r.status_code == 422


def test_create_reading_requires_value(client):
    r = client.post("/api/readings", json={"taken_at": "2026-06-11T14:30"})
    assert r.status_code == 422


def test_list_and_delete_reading(client):
    created = client.post("/api/readings", json={
        "value_mg_dl": 142, "taken_at": "2026-06-10T08:00", "note": "fasting",
    }).json()

    listed = client.get("/api/readings?days=30").json()
    assert any(row["id"] == created["id"] for row in listed)
    # newest first
    times = [row["taken_at"] for row in listed]
    assert times == sorted(times, reverse=True)

    assert client.delete(f"/api/readings/{created['id']}").status_code == 204
    listed = client.get("/api/readings?days=30").json()
    assert not any(row["id"] == created["id"] for row in listed)


def test_photo_endpoint_rejects_non_image(client):
    r = client.post(
        "/api/readings/photo",
        files={"photo": ("note.txt", b"not an image", "text/plain")},
    )
    assert r.status_code == 415


# ── stats ───────────────────────────────────────────────────────────────

def test_stats_summary_counts_ranges(client):
    ids = [
        client.post("/api/readings", json={"value_mg_dl": v}).json()["id"]
        for v in (60, 120, 250)  # one low, one in range, one high
    ]
    s = client.get("/api/stats/summary?days=1").json()
    assert s["count"] >= 3
    assert s["target"] == {"low": 70.0, "high": 180.0}
    assert s["latest"] is not None
    assert s["avg_mg_dl"] is not None and s["est_a1c"] is not None
    for rid in ids:
        client.delete(f"/api/readings/{rid}")


def test_stats_series_shape(client):
    s = client.get("/api/stats/series?days=14").json()
    assert set(s.keys()) == {"readings", "daily", "macros"}
    assert isinstance(s["readings"], list)


# ── meals ───────────────────────────────────────────────────────────────

def test_meal_create_list_delete(client):
    r = client.post("/api/meals", json={
        "name": "Grilled chicken & rice",
        "calories": 520, "carbs_g": 45, "sugar_g": 4, "fiber_g": 5,
        "protein_g": 42, "fat_g": 14, "glycemic_impact": "moderate",
        "tip": "Half the rice, double the greens.",
        "items": [{"name": "chicken breast", "portion": "6 oz"}],
    })
    assert r.status_code == 201
    meal = r.json()
    assert meal["name"] == "Grilled chicken & rice"
    assert meal["eaten_at"] is not None  # defaulted to now

    listed = client.get("/api/meals?days=30").json()
    assert any(m["id"] == meal["id"] for m in listed)

    assert client.delete(f"/api/meals/{meal['id']}").status_code == 204


def test_meal_analyze_requires_input(client):
    assert client.post("/api/meals/analyze", data={}).status_code == 422


def test_meal_analyze_without_api_key_is_503_not_500(client):
    r = client.post("/api/meals/analyze", data={"description": "two eggs and toast"})
    assert r.status_code == 503
    assert "not configured" in r.json()["detail"]


# ── recipes ─────────────────────────────────────────────────────────────

def test_recipes_seeded_and_searchable(client):
    recipes = client.get("/api/recipes").json()
    assert len(recipes) > 0
    sample = recipes[0]
    assert {"title", "ingredients", "instructions", "tags"} <= set(sample.keys())

    # search by a word from a known title
    word = sample["title"].split()[-1]
    hits = client.get(f"/api/recipes?q={word}").json()
    assert any(r["id"] == sample["id"] for r in hits)

    assert client.get("/api/recipes?q=zzz-no-such-recipe").json() == []

    tags = client.get("/api/recipes/tags").json()
    assert isinstance(tags, list) and len(tags) > 0
    by_tag = client.get(f"/api/recipes?tag={tags[0]}").json()
    assert all(tags[0] in r["tags"] for r in by_tag)


# ── shopping list ───────────────────────────────────────────────────────

def test_shopping_add_toggle_clear(client):
    item = client.post("/api/shopping", json={
        "name": "glucose tabs", "quantity": "1 bottle", "category": "Pantry",
    }).json()
    assert item["checked"] is False

    toggled = client.patch(f"/api/shopping/{item['id']}", json={"checked": True}).json()
    assert toggled["checked"] is True

    # clear-checked removes it
    assert client.delete("/api/shopping").status_code == 204
    remaining = client.get("/api/shopping").json()
    assert not any(i["id"] == item["id"] for i in remaining)


def test_shopping_toggle_missing_item_404(client):
    assert client.patch("/api/shopping/999999", json={"checked": True}).status_code == 404


def test_shopping_from_recipes_dedupes(client):
    recipe = client.get("/api/recipes").json()[0]

    first = client.post("/api/shopping/from-recipes", json={"recipe_ids": [recipe["id"]]}).json()
    assert first["added"] > 0
    # same recipe again: every unchecked ingredient already on the list
    second = client.post("/api/shopping/from-recipes", json={"recipe_ids": [recipe["id"]]}).json()
    assert second["added"] == 0

    # cleanup
    for i in client.get("/api/shopping").json():
        client.delete(f"/api/shopping/{i['id']}")


def test_shopping_from_recipes_requires_selection(client):
    assert client.post("/api/shopping/from-recipes", json={"recipe_ids": []}).status_code == 422
