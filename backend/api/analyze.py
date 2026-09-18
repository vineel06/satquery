# backend/api/analyze.py
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List
from ai.gemini_client import ask_gemini
from ai.prompts import SYSTEM_PROMPT, build_user_prompt
from utils.images import process_image_b64
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


class HistoryTurn(BaseModel):
    role: str
    content: str


class Region(BaseModel):
    name: str
    type: str = "city"


class AnalyzePayload(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    imageBase64: Optional[str] = None
    imageMimeType: Optional[str] = None
    imageBeforeBase64: Optional[str] = None
    imageAfterBase64: Optional[str] = None
    location: Optional[dict] = None
    bounds: Optional[List[float]] = None
    region: Optional[Region] = None
    dateRange: Optional[dict] = None
    conversationHistory: Optional[List[HistoryTurn]] = None
    context: Optional[dict] = None


@router.post("/api/analyze")
@limiter.limit("15/minute")
async def analyze(request: Request, payload: AnalyzePayload):
    images: list[tuple[str, str]] = []
    image_hashes: list[str] = []

    # Single image
    if payload.imageBase64:
        try:
            b64, h = process_image_b64(payload.imageBase64)
            images.append((b64, "Uploaded image:"))
            image_hashes.append(h)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    # Compare mode: before + after
    if payload.imageBeforeBase64:
        try:
            b64, h = process_image_b64(payload.imageBeforeBase64)
            images.append((b64, "BEFORE image:"))
            image_hashes.append(h)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid BEFORE image: {e}")

    if payload.imageAfterBase64:
        try:
            b64, h = process_image_b64(payload.imageAfterBase64)
            images.append((b64, "AFTER image:"))
            image_hashes.append(h)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid AFTER image: {e}")

    history_str: str | None = None
    if payload.conversationHistory:
        history_str = "\n".join(
            f"{t.role}: {t.content}" for t in payload.conversationHistory[-6:]
        )

    loc_str = "not specified"
    if payload.location:
        name = payload.location.get("name") or ""
        lat = payload.location.get("lat")
        lng = payload.location.get("lng")
        loc_str = f"{name} ({lat}, {lng})".strip()

    bounds_str = "not specified"
    if payload.bounds and len(payload.bounds) == 4:
        bounds_str = f"[{payload.bounds[0]}, {payload.bounds[1]}, {payload.bounds[2]}, {payload.bounds[3]}]"

    region_type = payload.region.type if payload.region else "city"
    date_str = "not specified"
    if payload.dateRange:
        date_str = f"{payload.dateRange.get('start', '?')} to {payload.dateRange.get('end', '?')}"

    has_compare = bool(payload.imageBeforeBase64 and payload.imageAfterBase64)
    has_single = bool(payload.imageBase64)

    user_prompt = build_user_prompt(
        query=payload.query,
        location=loc_str,
        bounds=bounds_str,
        region_type=region_type,
        date_range=date_str,
        has_image=has_single,
        has_compare=has_compare,
        history=history_str,
    )

    try:
        result = ask_gemini(SYSTEM_PROMPT, user_prompt, images, image_hashes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {e}")

    return result