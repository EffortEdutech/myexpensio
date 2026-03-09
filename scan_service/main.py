# scan_service/main.py
# Version: 4.0.0
#
# RECEIPT pipeline:
#   corners provided by user → warpPerspective → CLAHE → sharpen
#   no corners              → CLAHE → sharpen (no warp)
#
# ODOMETER pipeline:
#   CLAHE → strong sharpen

import os
import base64
import logging
from typing import Literal

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Config ────────────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("scan")

SCAN_API_SECRET = os.environ.get("SCAN_API_SECRET", "")

ALLOWED_ORIGINS = [
    "https://myexpensio-jade.vercel.app",
    "http://localhost:3100",
    "http://localhost:3101",
]

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="myexpensio-scan", version="4.0.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Scan-Secret", "Content-Type"],
)

# ── Auth ──────────────────────────────────────────────────────────────────────

def verify_secret(x_scan_secret: str = Header(default="")) -> None:
    if not SCAN_API_SECRET:
        return  # dev mode
    if x_scan_secret != SCAN_API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid scan secret.")

# ── Models ────────────────────────────────────────────────────────────────────

class ProcessRequest(BaseModel):
    image:   str                                      # base64 JPEG
    mode:    Literal["RECEIPT", "ODOMETER"] = "RECEIPT"
    corners: list[list[float]] | None       = None   # [[x,y]*4] TL,TR,BR,BL in original px

class ProcessResponse(BaseModel):
    result:  str          # base64 JPEG
    applied: list[str]
    width:   int
    height:  int

# ── Codec ─────────────────────────────────────────────────────────────────────

def b64_to_cv(b64: str) -> np.ndarray:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    data = base64.b64decode(b64)
    arr  = np.frombuffer(data, dtype=np.uint8)
    img  = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image.")
    return img

def cv_to_b64(img: np.ndarray, quality: int = 92) -> str:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise ValueError("Could not encode image.")
    return base64.b64encode(buf.tobytes()).decode("utf-8")

# ── Geometry ──────────────────────────────────────────────────────────────────

def order_corners(pts: np.ndarray) -> np.ndarray:
    """Order 4 points: TL, TR, BR, BL."""
    pts  = pts.reshape(4, 2).astype(np.float32)
    s    = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).flatten()
    tl   = pts[np.argmin(s)]
    br   = pts[np.argmax(s)]
    tr   = pts[np.argmin(diff)]
    bl   = pts[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)

# ── Step — Perspective warp from user corners ─────────────────────────────────

def perspective_warp_user(img: np.ndarray,
                           corners: list[list[float]]) -> tuple[np.ndarray, bool]:
    """
    Apply perspective warp using corners provided by the user.
    corners = [[x,y]*4] in TL, TR, BR, BL order (original image pixels).
    Returns (warped_img, success).
    """
    if len(corners) != 4:
        log.warning("warp: expected 4 corners, got %d", len(corners))
        return img, False

    pts = np.array(corners, dtype=np.float32)

    # Re-order robustly in case frontend order drifted
    pts = order_corners(pts)
    tl, tr, br, bl = pts

    # Output dimensions — max width and height of the quad
    W = int(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
    H = int(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr)))

    if W < 80 or H < 80:
        log.warning("warp: computed output too small (%dx%d) — skipping", W, H)
        return img, False

    dst = np.array([
        [0,     0    ],
        [W - 1, 0    ],
        [W - 1, H - 1],
        [0,     H - 1],
    ], dtype=np.float32)

    M      = cv2.getPerspectiveTransform(pts, dst)
    warped = cv2.warpPerspective(
        img, M, (W, H),
        flags=cv2.INTER_LANCZOS4,
        borderMode=cv2.BORDER_REPLICATE,
    )

    log.info("perspective warp done — %dx%d", W, H)
    return warped, True

# ── Step — CLAHE ──────────────────────────────────────────────────────────────

def clahe_enhance(img: np.ndarray,
                  clip_limit: float = 2.0,
                  tile_size: int = 8) -> np.ndarray:
    """
    CLAHE on L channel (LAB colour space).
    Enhances local contrast without global blowout.
    """
    lab     = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe   = cv2.createCLAHE(clipLimit=clip_limit,
                               tileGridSize=(tile_size, tile_size))
    l_enh   = clahe.apply(l)
    result  = cv2.cvtColor(cv2.merge([l_enh, a, b]), cv2.COLOR_LAB2BGR)
    log.info("CLAHE done — clip=%.1f tile=%d", clip_limit, tile_size)
    return result

# ── Step — Sharpen ────────────────────────────────────────────────────────────

def sharpen(img: np.ndarray, strength: float = 1.0) -> np.ndarray:
    """Unsharp mask — boosts text/edge detail."""
    blur   = cv2.GaussianBlur(img, (0, 0), 3)
    result = cv2.addWeighted(img, 1.0 + strength, blur, -strength, 0)
    log.info("sharpen done — strength=%.1f", strength)
    return result

# ── Pipelines ─────────────────────────────────────────────────────────────────

def process_receipt(img: np.ndarray,
                    corners: list[list[float]] | None) -> tuple[np.ndarray, list[str]]:
    """
    RECEIPT pipeline:
    1. Perspective warp   — uses user-provided corners from ScanPreviewModal
    2. CLAHE              — local contrast enhancement
    3. Sharpen            — crisp text
    """
    applied: list[str] = []

    # 1. Perspective warp
    if corners:
        img, ok = perspective_warp_user(img, corners)
        applied.append("perspective_warp_user" if ok else "no_warp_invalid_corners")
    else:
        # No corners sent — skip warp (user did not adjust handles)
        applied.append("no_warp_no_corners")

    # 2. CLAHE
    img = clahe_enhance(img, clip_limit=2.5, tile_size=8)
    applied.append("clahe_enhancement")

    # 3. Sharpen
    img = sharpen(img, strength=0.8)
    applied.append("sharpen")

    return img, applied


def process_odometer(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """
    ODOMETER pipeline:
    1. CLAHE              — local contrast (digits pop)
    2. Strong sharpen     — crisp digit edges
    """
    applied: list[str] = []
    img = clahe_enhance(img, clip_limit=3.0, tile_size=6)
    applied.append("clahe_enhancement")
    img = sharpen(img, strength=1.5)
    applied.append("sharpen")
    return img, applied

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "myexpensio-scan", "version": "4.0.0"}


@app.post("/process", response_model=ProcessResponse)
def process(req: ProcessRequest, x_scan_secret: str = Header(default="")):
    verify_secret(x_scan_secret)
    log.info("process — mode=%s corners=%s", req.mode,
             "yes" if req.corners else "no")

    try:
        img = b64_to_cv(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decode failed: {e}")

    log.info("image %dx%d", img.shape[1], img.shape[0])

    try:
        if req.mode == "RECEIPT":
            result, applied = process_receipt(img, req.corners)
        else:
            result, applied = process_odometer(img)
    except Exception as e:
        log.exception("pipeline error")
        raise HTTPException(status_code=500, detail=f"Processing error: {e}")

    try:
        b64 = cv_to_b64(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encode failed: {e}")

    h, w = result.shape[:2]
    log.info("done — applied=%s output=%dx%d", applied, w, h)
    return ProcessResponse(result=b64, applied=applied, width=w, height=h)
