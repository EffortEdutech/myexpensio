# scan_service/main.py
#
# FastAPI + OpenCV image processing microservice.
# Deployed on Render.com free tier (Singapore region).
#
# Endpoints:
#   GET  /health          — liveness check
#   POST /process         — process image (RECEIPT or ODOMETER)
#
# Security:
#   Every request must include header: X-Scan-Secret: <SCAN_API_SECRET>
#   Secret is set as Render env var and mirrored in Vercel env vars.
#   Never expose this secret in browser code — always proxy via Next.js API route.
#
# Processing modes:
#   RECEIPT  — edge detect → find corners → perspective warp → contrast enhance
#   ODOMETER — sharpen → brightness/contrast boost (no warp needed)

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
# Allowed origins — only your Vercel deployment and localhost for dev
ALLOWED_ORIGINS = [
    "https://myexpensio-jade.vercel.app",
    "http://localhost:3100",
    "http://localhost:3101",
]

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="myexpensio-scan", version="1.0.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Scan-Secret", "Content-Type"],
)

# ── Auth ──────────────────────────────────────────────────────────────────────

def verify_secret(x_scan_secret: str = Header(default="")) -> None:
    if not SCAN_API_SECRET:
        # Dev mode — no secret configured, allow all
        return
    if x_scan_secret != SCAN_API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid scan secret.")

# ── Models ────────────────────────────────────────────────────────────────────

class ProcessRequest(BaseModel):
    image:  str                          # base64-encoded JPEG
    mode:   Literal["RECEIPT", "ODOMETER"] = "RECEIPT"

class ProcessResponse(BaseModel):
    result:  str                         # base64-encoded JPEG (processed)
    applied: list[str]                   # list of operations actually applied
    width:   int
    height:  int

# ── Helpers ───────────────────────────────────────────────────────────────────

def b64_to_cv(b64: str) -> np.ndarray:
    """Decode base64 string to OpenCV BGR image."""
    # Strip data URI prefix if present (data:image/jpeg;base64,...)
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    data = base64.b64decode(b64)
    arr  = np.frombuffer(data, dtype=np.uint8)
    img  = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image — not a valid JPEG/PNG.")
    return img


def cv_to_b64(img: np.ndarray, quality: int = 92) -> str:
    """Encode OpenCV BGR image to base64 JPEG string."""
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise ValueError("Could not encode processed image.")
    return base64.b64encode(buf.tobytes()).decode("utf-8")


def order_corners(pts: np.ndarray) -> np.ndarray:
    """
    Order 4 points as [top-left, top-right, bottom-right, bottom-left].
    Needed for correct perspective warp.
    """
    pts   = pts.reshape(4, 2).astype(np.float32)
    s     = pts.sum(axis=1)
    diff  = np.diff(pts, axis=1)
    tl    = pts[np.argmin(s)]
    br    = pts[np.argmax(s)]
    tr    = pts[np.argmin(diff)]
    bl    = pts[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def find_document_corners(img: np.ndarray) -> np.ndarray | None:
    """
    Detect the 4 corners of a document (receipt) in the image.
    Returns ordered (4,2) float32 array or None if not found.
    Pipeline: resize → gray → blur → Canny → dilate → findContours → approxPolyDP
    """
    h, w  = img.shape[:2]

    # Work on a small copy for speed — scale corners back after
    scale = 800.0 / max(h, w)
    small = cv2.resize(img, (int(w * scale), int(h * scale)))

    gray  = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    blur  = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    # Dilate edges slightly to close small gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    edges  = cv2.dilate(edges, kernel, iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    # Sort by area descending — largest contour is likely the document
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    min_area = small.shape[0] * small.shape[1] * 0.05   # at least 5% of frame

    for cnt in contours[:5]:   # check top 5 largest
        area = cv2.contourArea(cnt)
        if area < min_area:
            break
        peri   = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            # Scale corners back to original image size
            corners = approx.reshape(4, 2) / scale
            return order_corners(corners)

    return None


def perspective_warp(img: np.ndarray, corners: np.ndarray) -> np.ndarray:
    """
    Apply perspective transform to produce a flat, rectangular image.
    Output dimensions are derived from the longest detected edges.
    """
    tl, tr, br, bl = corners

    width_top    = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    W            = int(max(width_top, width_bottom))

    height_left  = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)
    H            = int(max(height_left, height_right))

    if W < 50 or H < 50:
        return img   # too small — return original

    dst = np.array([
        [0,     0    ],
        [W - 1, 0    ],
        [W - 1, H - 1],
        [0,     H - 1],
    ], dtype=np.float32)

    M        = cv2.getPerspectiveTransform(corners, dst)
    warped   = cv2.warpPerspective(img, M, (W, H))
    return warped


def auto_contrast(img: np.ndarray) -> np.ndarray:
    """
    Stretch histogram to full 0–255 range per channel.
    Makes dark/faded receipts readable.
    """
    result = np.zeros_like(img)
    for i in range(3):
        ch       = img[:, :, i]
        mn, mx   = ch.min(), ch.max()
        if mx > mn:
            result[:, :, i] = ((ch.astype(np.float32) - mn) / (mx - mn) * 255).clip(0, 255).astype(np.uint8)
        else:
            result[:, :, i] = ch
    return result


def sharpen(img: np.ndarray, strength: float = 1.0) -> np.ndarray:
    """
    Unsharp mask sharpening — enhances text edges.
    strength 0.5–2.0 (1.0 = standard)
    """
    blur     = cv2.GaussianBlur(img, (0, 0), 3)
    sharp    = cv2.addWeighted(img, 1 + strength, blur, -strength, 0)
    return sharp


def brightness_contrast(img: np.ndarray, alpha: float = 1.2, beta: int = 15) -> np.ndarray:
    """
    alpha > 1  = more contrast
    beta  > 0  = brighter
    """
    return cv2.convertScaleAbs(img, alpha=alpha, beta=beta)


# ── Processing pipelines ──────────────────────────────────────────────────────

def process_receipt(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """
    Full receipt pipeline:
    1. Find document corners (Canny + contours)
    2. Perspective warp if corners found
    3. Auto contrast stretch
    4. Sharpen
    """
    applied: list[str] = []

    # Step 1+2 — perspective correction
    corners = find_document_corners(img)
    if corners is not None:
        img     = perspective_warp(img, corners)
        applied.append("perspective_warp")
        log.info("perspective warp applied")
    else:
        log.info("corners not detected — skipping warp")
        applied.append("no_warp_corners_not_found")

    # Step 3 — auto contrast
    img = auto_contrast(img)
    applied.append("auto_contrast")

    # Step 4 — sharpen
    img = sharpen(img, strength=0.8)
    applied.append("sharpen")

    return img, applied


def process_odometer(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """
    Odometer pipeline — no warp needed, focus on clarity:
    1. Brightness + contrast boost
    2. Strong sharpen (digits must be crisp)
    """
    applied: list[str] = []

    img = brightness_contrast(img, alpha=1.3, beta=20)
    applied.append("brightness_contrast")

    img = sharpen(img, strength=1.5)
    applied.append("sharpen")

    return img, applied


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "myexpensio-scan"}


@app.post("/process", response_model=ProcessResponse)
def process(req: ProcessRequest, x_scan_secret: str = Header(default="")):
    verify_secret(x_scan_secret)

    log.info(f"process request — mode={req.mode} image_len={len(req.image)}")

    # Decode
    try:
        img = b64_to_cv(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decode failed: {e}")

    # Process
    try:
        if req.mode == "RECEIPT":
            result, applied = process_receipt(img)
        else:
            result, applied = process_odometer(img)
    except Exception as e:
        log.exception("Processing failed")
        raise HTTPException(status_code=500, detail=f"Processing error: {e}")

    # Encode
    try:
        b64 = cv_to_b64(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encode failed: {e}")

    h, w = result.shape[:2]
    log.info(f"done — applied={applied} output={w}x{h}")

    return ProcessResponse(result=b64, applied=applied, width=w, height=h)
