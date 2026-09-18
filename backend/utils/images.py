# backend/utils/images.py
import base64, hashlib, io
from PIL import Image

MAX_DIM = 1024

def process_image_b64(b64: str) -> tuple[str, str]:
    """Resize a base64 image to <=1024px on the longest side. Returns (b64, hash)."""
    raw = base64.b64decode(b64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    if max(img.size) > MAX_DIM:
        img.thumbnail((MAX_DIM, MAX_DIM), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85, optimize=True)
    out = base64.b64encode(buf.getvalue()).decode()
    h = hashlib.sha256(buf.getvalue()).hexdigest()[:16]
    return out, h