"""Vision AI: glucometer OCR and meal macro estimation.

Two providers, selected by VISION_PROVIDER (see settings.py / .env.example):

- "anthropic" — Claude via the official SDK with schema-validated parse().
- "openai"   — any OpenAI-compatible endpoint (OpenAI, Ollama, LM Studio,
               llama.cpp, vLLM, OpenRouter…). JSON is requested via prompt +
               response_format and validated with the same Pydantic schemas.
"""

import base64
import json
import re
from typing import Literal

from pydantic import BaseModel

import settings

# ── output schemas (shared by both providers) ─────────────────────────


class GlucometerRead(BaseModel):
    value: float | None
    unit: Literal["mg/dL", "mmol/L"] | None
    display_date: str | None  # exactly as shown on screen, e.g. "06-10" or "Jun 10 2026"
    display_time: str | None  # exactly as shown, e.g. "7:42 AM" or "19:42"
    iso_datetime: str | None  # best-effort ISO 8601 built from the display, null if unreadable
    confidence: Literal["high", "medium", "low"]
    notes: str | None


class FoodItem(BaseModel):
    name: str
    portion: str
    calories: float
    carbs_g: float
    sugar_g: float
    fiber_g: float
    protein_g: float
    fat_g: float


class MealAnalysis(BaseModel):
    meal_name: str
    items: list[FoodItem]
    calories: float
    carbs_g: float
    sugar_g: float
    fiber_g: float
    protein_g: float
    fat_g: float
    glycemic_impact: Literal["low", "moderate", "high"]
    tip: str  # one short, practical note for a diabetic eating this meal


# ── prompts ───────────────────────────────────────────────────────────


def glucometer_prompt(today_iso: str) -> str:
    return (
        "This is a photo of a blood glucose meter. Read the display.\n"
        "- Extract the glucose value and its unit (mg/dL or mmol/L).\n"
        "- Extract the date and time shown ON THE METER'S SCREEN, exactly as displayed.\n"
        f"- Build iso_datetime from the display. Today is {today_iso}; if the meter "
        "shows no year, assume the most recent past occurrence of that date. If no "
        "date/time is visible, set iso_datetime to null.\n"
        "- If the number could be misread (glare, partial digits), say so in notes "
        "and lower confidence."
    )


def meal_photo_prompt(hint: str | None) -> str:
    text = (
        "Analyze this photo of a meal for a person managing diabetes. Identify each "
        "food item and estimate realistic portions from visual cues (plate size, "
        "utensils). For each item estimate calories, carbs, sugar, fiber, protein and "
        "fat in grams. Totals must equal the sum of items. Set glycemic_impact based "
        "on net carbs, sugar content and how fast-acting the carbs are. The tip should "
        "be one practical sentence (e.g. eat the protein first, watch the sauce)."
    )
    if hint:
        text += f"\nThe user added: {hint!r}"
    return text


def meal_text_prompt(description: str) -> str:
    return (
        "A person managing diabetes ate the following. Break it into items with "
        "realistic portion estimates and per-item calories, carbs, sugar, fiber, "
        "protein and fat in grams. Totals must equal the sum of items. Set "
        "glycemic_impact from net carbs and how fast-acting they are. The tip "
        "should be one practical sentence.\n\n"
        f"Meal: {description}"
    )


# ── anthropic provider ────────────────────────────────────────────────

_anthropic_client = None


async def _ask_anthropic(prompt: str, schema: type[BaseModel], image: bytes | None, media_type: str | None):
    global _anthropic_client
    import anthropic

    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    content = []
    if image is not None:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": media_type,
                "data": base64.standard_b64encode(image).decode("utf-8"),
            },
        })
    content.append({"type": "text", "text": prompt})

    response = await _anthropic_client.messages.parse(
        model=settings.VISION_MODEL,
        max_tokens=16000,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": content}],
        output_format=schema,
    )
    return response.parsed_output


# ── openai-compatible provider ────────────────────────────────────────

_openai_client = None


def _extract_json(text: str) -> str:
    """Tolerate code fences and chatter around the JSON object."""
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        return text[start : end + 1]
    return text


async def _ask_openai(prompt: str, schema: type[BaseModel], image: bytes | None, media_type: str | None):
    global _openai_client
    from openai import AsyncOpenAI

    if _openai_client is None:
        _openai_client = AsyncOpenAI(
            base_url=settings.OPENAI_BASE_URL or None,
            api_key=settings.OPENAI_API_KEY or "not-needed",
        )

    schema_json = json.dumps(schema.model_json_schema(), indent=None)
    system = (
        "You are a precise extraction engine. Respond with ONE JSON object that "
        f"validates against this JSON schema, and nothing else:\n{schema_json}"
    )
    user_content = [{"type": "text", "text": prompt}]
    if image is not None:
        b64 = base64.standard_b64encode(image).decode("utf-8")
        user_content.insert(0, {
            "type": "image_url",
            "image_url": {"url": f"data:{media_type};base64,{b64}"},
        })

    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]
    kwargs = dict(model=settings.VISION_MODEL, messages=messages, temperature=0.1)
    try:
        resp = await _openai_client.chat.completions.create(
            **kwargs, response_format={"type": "json_object"}
        )
    except Exception:
        # some local servers reject response_format — retry without it
        resp = await _openai_client.chat.completions.create(**kwargs)

    raw = resp.choices[0].message.content or ""
    return schema.model_validate_json(_extract_json(raw))


# ── dispatch ──────────────────────────────────────────────────────────


async def _ask(prompt: str, schema: type[BaseModel], image: bytes | None = None, media_type: str | None = None):
    status = settings.vision_status()
    if not status["configured"]:
        raise RuntimeError(
            f"Vision provider '{status['provider']}' is not configured: "
            f"{status['detail']} (see backend/.env.example)."
        )
    if settings.VISION_PROVIDER == "anthropic":
        return await _ask_anthropic(prompt, schema, image, media_type)
    return await _ask_openai(prompt, schema, image, media_type)


async def read_glucometer(image: bytes, media_type: str, today_iso: str) -> GlucometerRead:
    return await _ask(glucometer_prompt(today_iso), GlucometerRead, image, media_type)


async def analyze_meal_photo(image: bytes, media_type: str, hint: str | None) -> MealAnalysis:
    return await _ask(meal_photo_prompt(hint), MealAnalysis, image, media_type)


async def analyze_meal_text(description: str) -> MealAnalysis:
    return await _ask(meal_text_prompt(description), MealAnalysis)
