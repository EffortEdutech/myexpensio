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

app = FastAPI(title="myexpensio-scan", version="1.1.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Scan-Secret", "Content-Type"],
)

# ── Auth ──────────────────────────────────────────────────────────────────────

def verify_secret(x_scan_secret: str = Header(default="")) -> None:
    if not SCAN_API_SECRET:
        return   # dev mode — no secret configured
    if x_scan_secret != SCAN_API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid scan secret.")

# ── Models ────────────────────────────────────────────────────────────────────

class ProcessRequest(BaseModel):
    image:  str
    mode:   Literal["RECEIPT", "ODOMETER"] = "RECEIPT"

class ProcessResponse(BaseModel):
    result:  str
    applied: list[str]
    width:   int
    height:  int

# ── Helpers ───────────────────────────────────────────────────────────────────

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


def order_corners(pts: np.ndarray) -> np.ndarray:
    """Order 4 points: top-left, top-right, bottom-right, bottom-left."""
    pts  = pts.reshape(4, 2).astype(np.float32)
    s    = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).flatten()
    tl   = pts[np.argmin(s)]
    br   = pts[np.argmax(s)]
    tr   = pts[np.argmin(diff)]
    bl   = pts[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def find_document_corners(img: np.ndarray) -> np.ndarray | None:
    """
    Multi-strategy corner detection for receipts on any background.

    Strategy 1: Canny edges — works when receipt has clear boundary
    Strategy 2: Adaptive threshold — works when background is similar color
    Strategy 3: Simple threshold on grayscale — fallback for high contrast scenes

    Returns ordered (4,2) float32 array or None if no 4-corner contour found.
    """
    h, w = img.shape[:2]

    # Work on resized copy for speed — scale back after
    scale = min(1.0, 1200.0 / max(h, w))
    small = cv2.resize(img, (int(w * scale), int(h * scale)))
    sh, sw = small.shape[:2]

    gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

    # Minimum area: receipt must be at least 10% of the frame
    min_area = sh * sw * 0.10

    def find_quad(edge_map: np.ndarray) -> np.ndarray | None:
        """Find largest 4-sided contour in an edge/binary map."""
        # Close small gaps in edges
        kernel  = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        closed  = cv2.morphologyEx(edge_map, cv2.MORPH_CLOSE, kernel)
        dilated = cv2.dilate(closed, kernel, iterations=2)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None

        # Sort by area descending
        contours = sorted(contours, key=cv2.contourArea, reverse=True)

        for cnt in contours[:8]:
            area = cv2.contourArea(cnt)
            if area < min_area:
                break

            # Try progressively looser approximations
            for epsilon_factor in [0.01, 0.02, 0.03, 0.05]:
                peri   = cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, epsilon_factor * peri, True)
                if len(approx) == 4:
                    corners = approx.reshape(4, 2).astype(np.float32) / scale
                    return order_corners(corners)

            # If we couldn't get 4 points, try convex hull
            hull = cv2.convexHull(cnt)
            peri = cv2.arcLength(hull, True)
            for epsilon_factor in [0.01, 0.02, 0.04, 0.08]:
                approx = cv2.approxPolyDP(hull, epsilon_factor * peri, True)
                if len(approx) == 4:
                    corners = approx.reshape(4, 2).astype(np.float32) / scale
                    return order_corners(corners)

        return None

    # ── Strategy 1: Canny with auto thresholds (Otsu-derived) ───────────────
    blur       = cv2.GaussianBlur(gray, (5, 5), 0)
    otsu_thresh, _ = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    edges_canny = cv2.Canny(blur, otsu_thresh * 0.3, otsu_thresh)
    result = find_quad(edges_canny)
    if result is not None:
        log.info("corners found via Canny strategy")
        return result

    # ── Strategy 2: Adaptive threshold ──────────────────────────────────────
    blur2       = cv2.GaussianBlur(gray, (9, 9), 0)
    adaptive    = cv2.adaptiveThreshold(
        blur2, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        blockSize=21, C=10
    )
    result = find_quad(adaptive)
    if result is not None:
        log.info("corners found via adaptive threshold strategy")
        return result

    # ── Strategy 3: Simple threshold ────────────────────────────────────────
    _, simple = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    result = find_quad(simple)
    if result is not None:
        log.info("corners found via simple threshold strategy")
        return result

    log.info("no 4-corner contour found across all strategies")
    return None


def perspective_warp(img: np.ndarray, corners: np.ndarray) -> np.ndarray:
    """Warp perspective to produce flat rectangular image."""
    tl, tr, br, bl = corners

    width_top    = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    W            = int(max(width_top, width_bottom))

    height_left  = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)
    H            = int(max(height_left, height_right))

    if W < 80 or H < 80:
        log.info("warped dimensions too small — skipping warp")
        return img

    dst = np.array([
        [0,     0    ],
        [W - 1, 0    ],
        [W - 1, H - 1],
        [0,     H - 1],
    ], dtype=np.float32)

    M      = cv2.getPerspectiveTransform(corners, dst)
    warped = cv2.warpPerspective(img, M, (W, H))
    log.info(f"perspective warp applied — output {W}x{H}")
    return warped


def auto_contrast(img: np.ndarray) -> np.ndarray:
    """Stretch histogram per channel to full 0–255 range."""
    result = np.zeros_like(img)
    for i in range(3):
        ch     = img[:, :, i]
        mn, mx = int(ch.min()), int(ch.max())
        if mx > mn:
            result[:, :, i] = ((ch.astype(np.float32) - mn) / (mx - mn) * 255).clip(0, 255).astype(np.uint8)
        else:
            result[:, :, i] = ch
    return result


def sharpen(img: np.ndarray, strength: float = 1.0) -> np.ndarray:
    """Unsharp mask — enhances text edges."""
    blur  = cv2.GaussianBlur(img, (0, 0), 3)
    sharp = cv2.addWeighted(img, 1.0 + strength, blur, -strength, 0)
    return sharp


def brightness_contrast(img: np.ndarray, alpha: float = 1.2, beta: int = 15) -> np.ndarray:
    return cv2.convertScaleAbs(img, alpha=alpha, beta=beta)


# ── Processing pipelines ──────────────────────────────────────────────────────

def process_receipt(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """
    Receipt pipeline:
    1. Multi-strategy corner detection
    2. Perspective warp (if corners found)
    3. Auto contrast
    4. Sharpen
    """
    applied: list[str] = []

    corners = find_document_corners(img)
    if corners is not None:
        img = perspective_warp(img, corners)
        applied.append("perspective_warp")
    else:
        applied.append("no_warp_corners_not_found")

    img = auto_contrast(img)
    applied.append("auto_contrast")

    img = sharpen(img, strength=0.8)
    applied.append("sharpen")

    return img, applied


def process_odometer(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """
    Odometer pipeline — focus on digit clarity:
    1. Brightness + contrast boost
    2. Strong sharpen
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
    return {"status": "ok", "service": "myexpensio-scan", "version": "1.1.0"}


@app.post("/process", response_model=ProcessResponse)
def process(req: ProcessRequest, x_scan_secret: str = Header(default="")):
    verify_secret(x_scan_secret)
    log.info(f"process — mode={req.mode} image_b64_len={len(req.image)}")

    try:
        img = b64_to_cv(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decode failed: {e}")

    log.info(f"decoded image — {img.shape[1]}x{img.shape[0]}")

    try:
        if req.mode == "RECEIPT":
            result, applied = process_receipt(img)
        else:
            result, applied = process_odometer(img)
    except Exception as e:
        log.exception("processing failed")
        raise HTTPException(status_code=500, detail=f"Processing error: {e}")

    try:
        b64 = cv_to_b64(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encode failed: {e}")

    h, w = result.shape[:2]
    log.info(f"done — applied={applied} output={w}x{h}")

    return ProcessResponse(result=b64, applied=applied, width=w, height=h)
