# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

load_dotenv(dotenv_path="../.env")

from api.analyze import router as analyze_router  # noqa: E402

app = FastAPI(title="SatQuery API", version="0.2.0")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "gemini_key": bool(os.getenv("GEMINI_API_KEY")),
        "gee_configured": bool(os.getenv("GEE_SERVICE_ACCOUNT_EMAIL")),
    }