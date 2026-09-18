# backend/ai/gemini_client.py
import os, json, hashlib, io, base64, time
from google import genai
from google.genai import types
from PIL import Image
from utils.cache import get, set as cache_set

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

MODEL_CHAIN = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"]
MAX_RETRIES_PER_MODEL = 2
RETRY_DELAY_SEC = 2.0


def _cache_key(prompt: str, image_hashes: list[str]) -> str:
    h = hashlib.sha256()
    h.update(prompt.encode())
    for ih in image_hashes:
        h.update(ih.encode())
    return f"gemini:{h.hexdigest()}"


def _is_retryable(err: Exception) -> bool:
    s = str(err).lower()
    return any(k in s for k in ["503", "unavailable", "429", "rate", "timeout", "deadline", "overloaded"])


def _to_part(b64: str, label: str = "") -> types.Part:
    raw = base64.b64decode(b64)
    img = Image.open(io.BytesIO(raw))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    text_part = types.Part.from_text(text=f"[{label}]") if label else None
    return types.Part.from_bytes(data=buf.getvalue(), mime_type="image/png")


def _call_one_model(
    model_name: str,
    system_prompt: str,
    user_prompt: str,
    images: list[tuple[str, str]],
):
    """images: list of (base64, label) tuples."""
    parts: list[types.Part] = [types.Part.from_text(text=user_prompt)]
    for b64, label in images:
        if label:
            parts.append(types.Part.from_text(text=label))
        parts.append(_to_part(b64, label))

    resp = _client.models.generate_content(
        model=model_name,
        contents=[types.Content(role="user", parts=parts)],
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )
    return resp.text or ""


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = {
            "intent": "GENERAL",
            "answer": text[:800] or "No response.",
            "evidence": {
                "source": "Gemini (non-JSON)",
                "limitations": "Model returned non-JSON.",
            },
            "layers": [],
            "suggestions": [],
        }
    data.setdefault("stats", [])
    data.setdefault("layers", [])
    data.setdefault("suggestions", [])
    data.setdefault("summary", "")
    return data


def ask_gemini(
    system_prompt: str,
    user_prompt: str,
    images: list[tuple[str, str]],
    image_hashes: list[str],
):
    if _client is None:
        raise RuntimeError("GEMINI_API_KEY missing in .env")

    key = _cache_key(system_prompt + user_prompt, image_hashes)
    cached = get(key)
    if cached is not None:
        cached["cached"] = True
        return cached

    last_err: Exception | None = None

    for model_name in MODEL_CHAIN:
        for attempt in range(MAX_RETRIES_PER_MODEL):
            try:
                text = _call_one_model(model_name, system_prompt, user_prompt, images)
                data = _parse_json(text)
                data["cached"] = False
                data["model_used"] = model_name
                cache_set(key, data, ttl_hours=24)
                return data
            except Exception as e:
                last_err = e
                if not _is_retryable(e):
                    raise
                if attempt < MAX_RETRIES_PER_MODEL - 1:
                    time.sleep(RETRY_DELAY_SEC * (attempt + 1))

    raise RuntimeError(f"All models failed. Last error: {last_err}.")