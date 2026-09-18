# backend/utils/cache.py
from diskcache import Cache
import os

CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

cache = Cache(os.path.join(CACHE_DIR, "satquery"))

def get(key: str):
    return cache.get(key)

def set(key: str, value, ttl_hours: int = 24):
    cache.set(key, value, expire=ttl_hours * 3600)