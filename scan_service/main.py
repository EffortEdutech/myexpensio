# scan_service/main.py
# Version: 2.0.0
#
# Advanced OpenCV image processing pipeline for myexpensio.
#
# RECEIPT pipeline:
#   1. Denoise
#   2. Hough Lines → 4 dominant edges → corner intersections
#   3. Perspective warp
#   4. CLAHE local contrast enhancement
#   5. Sharpen
#
# ODOMETER pipeline:
#   1. CLAHE local contrast enhancement
#   2. Strong sharpen

import os
import base64
import logging
import math
from typing import Literal
from itertools import combinations

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

app = FastAPI(title="myexpensio-scan", version="2.0.0", docs_url=None, redoc_url=None)

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
    image: str
    mode:  Literal["RECEIPT", "ODOMETER"] = "RECEIPT"

class ProcessResponse(BaseModel):
    result:  str
    applied: list[str]
    width:   int
    height:  int

# ── Codec helpers ─────────────────────────────────────────────────────────────

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

# ── Step 1 — Denoise ──────────────────────────────────────────────────────────

def denoise(img: np.ndarray) -> np.ndarray:
    """
    Remove camera sensor noise before edge detection.
    fastNlMeansDenoisingColored works on BGR images.
    h=10 — filter strength (higher = smoother, loses detail)
    templateWindowSize=7, searchWindowSize=21 — standard values
    """
    denoised = cv2.fastNlMeansDenoisingColored(img, None, h=10, hColor=10,
                                                templateWindowSize=7,
                                                searchWindowSize=21)
    log.info("denoise applied")
    return denoised

# ── Step 2 — Hough Line corner detection ──────────────────────────────────────

def hough_line_to_endpoints(rho: float, theta: float, length: int = 10000):
    """Convert Hough (rho, theta) line to two far endpoints."""
    a, b  = math.cos(theta), math.sin(theta)
    x0, y0 = a * rho, b * rho
    x1 = int(x0 + length * (-b))
    y1 = int(y0 + length * (a))
    x2 = int(x0 - length * (-b))
    y2 = int(y0 - length * (a))
    return (x1, y1), (x2, y2)


def line_intersection(line1, line2):
    """
    Compute intersection of two lines defined as (rho, theta).
    Returns (x, y) float or None if lines are parallel.
    """
    rho1, theta1 = line1
    rho2, theta2 = line2

    a = np.array([
        [math.cos(theta1), math.sin(theta1)],
        [math.cos(theta2), math.sin(theta2)],
    ])
    b = np.array([rho1, rho2])

    det = np.linalg.det(a)
    if abs(det) < 1e-10:
        return None  # parallel lines

    pt = np.linalg.solve(a, b)
    return (float(pt[0]), float(pt[1]))


def angle_diff(theta1: float, theta2: float) -> float:
    """Absolute angular difference between two Hough angles, in degrees."""
    diff = abs(math.degrees(theta1) - math.degrees(theta2))
    return min(diff, 180.0 - diff)


def cluster_lines(lines: np.ndarray, rho_thresh: float = 40, theta_thresh: float = 0.2):
    """
    Merge similar Hough lines into single representative lines.
    Prevents duplicate edges from being detected as separate lines.
    """
    if lines is None or len(lines) == 0:
        return []

    clusters = []
    for line in lines:
        rho, theta = float(line[0][0]), float(line[0][1])
        merged = False
        for cluster in clusters:
            c_rho, c_theta = cluster[0]
            if abs(rho - c_rho) < rho_thresh and abs(theta - c_theta) < theta_thresh:
                # Merge into cluster — running average
                n = cluster[1]
                cluster[0] = ((c_rho * n + rho) / (n + 1),
                              (c_theta * n + theta) / (n + 1))
                cluster[1] += 1
                merged = True
                break
        if not merged:
            clusters.append([[rho, theta], 1])

    return [c[0] for c in clusters]


def order_corners(pts: list) -> np.ndarray:
    """Order 4 corners: top-left, top-right, bottom-right, bottom-left."""
    arr  = np.array(pts, dtype=np.float32)
    s    = arr.sum(axis=1)
    diff = np.diff(arr, axis=1).flatten()
    tl   = arr[np.argmin(s)]
    br   = arr[np.argmax(s)]
    tr   = arr[np.argmin(diff)]
    bl   = arr[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def find_corners_hough(img: np.ndarray) -> np.ndarray | None:
    """
    Hough Line Transform corner detection.

    Pipeline:
    1. Resize to working size
    2. Grayscale → Gaussian blur
    3. Canny edge map (auto threshold via Otsu)
    4. HoughLines to detect all strong lines
    5. Cluster duplicate lines
    6. Separate into horizontal and vertical groups
    7. Pick 2 best horizontal + 2 best vertical lines
    8. Compute all 4 intersection points
    9. Validate corners are inside image and form a reasonable quad
    10. Scale back to original size
    """
    h, w = img.shape[:2]

    # Working resolution — 1200px on longest side
    scale = min(1.0, 1200.0 / max(h, w))
    work  = cv2.resize(img, (int(w * scale), int(h * scale)))
    wh, ww = work.shape[:2]

    gray = cv2.cvtColor(work, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # Auto Canny threshold derived from Otsu
    otsu_thresh, _ = cv2.threshold(blur, 0, 255,
                                   cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    edges = cv2.Canny(blur, otsu_thresh * 0.3, otsu_thresh)

    # Hough lines — detect strong straight lines
    # threshold=80: minimum votes (lower = more lines detected)
    raw_lines = cv2.HoughLines(edges, rho=1, theta=np.pi / 180,
                                threshold=80)

    if raw_lines is None or len(raw_lines) < 4:
        # Retry with lower threshold if not enough lines
        raw_lines = cv2.HoughLines(edges, rho=1, theta=np.pi / 180,
                                    threshold=50)

    if raw_lines is None or len(raw_lines) < 4:
        log.info("Hough: not enough lines detected")
        return None

    # Cluster to remove near-duplicates
    clustered = cluster_lines(raw_lines, rho_thresh=40, theta_thresh=0.2)
    log.info(f"Hough: {len(raw_lines)} raw lines → {len(clustered)} clustered")

    if len(clustered) < 4:
        log.info("Hough: not enough clustered lines")
        return None

    # Separate into horizontal (theta near 0 or π) and vertical (theta near π/2)
    horizontal, vertical = [], []
    for rho, theta in clustered:
        angle_deg = math.degrees(theta) % 180
        if angle_deg < 30 or angle_deg > 150:
            # Near-horizontal line (rho/theta convention)
            vertical.append((rho, theta))
        elif 60 < angle_deg < 120:
            horizontal.append((rho, theta))

    log.info(f"Hough: {len(horizontal)} horizontal, {len(vertical)} vertical lines")

    # Need at least 2 of each
    if len(horizontal) < 2 or len(vertical) < 2:
        log.info("Hough: insufficient horizontal or vertical lines")
        return None

    # Sort by |rho| — first two are the outermost parallel lines
    horizontal = sorted(horizontal, key=lambda l: abs(l[0]))
    vertical   = sorted(vertical,   key=lambda l: abs(l[0]))

    # Try all combinations of 2h × 2v and pick best quad
    best_corners = None
    best_area    = 0.0

    for h_pair in combinations(horizontal[:4], 2):
        for v_pair in combinations(vertical[:4], 2):
            # Compute 4 intersections
            pts = []
            for hl in h_pair:
                for vl in v_pair:
                    pt = line_intersection(hl, vl)
                    if pt is not None:
                        pts.append(pt)

            if len(pts) != 4:
                continue

            # All corners must be within image bounds (with small margin)
            margin = -50  # allow slightly outside frame
            if not all(margin <= p[0] <= ww - margin and
                       margin <= p[1] <= wh - margin for p in pts):
                continue

            # Compute quad area
            ordered = order_corners(pts)
            area    = cv2.contourArea(ordered)

            # Must cover at least 8% of frame
            if area < ww * wh * 0.08:
                continue

            if area > best_area:
                best_area    = area
                best_corners = ordered

    if best_corners is None:
        log.info("Hough: no valid quad from line intersections")
        return None

    # Scale corners back to original image dimensions
    best_corners = best_corners / scale
    log.info(f"Hough: corners found — quad area={best_area:.0f}px² (scaled)")
    return best_corners


# ── Step 3 — Perspective warp ─────────────────────────────────────────────────

def perspective_warp(img: np.ndarray, corners: np.ndarray) -> np.ndarray:
    """Warp image to flat rectangle using computed corners."""
    tl, tr, br, bl = corners

    width_top    = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    W            = int(max(width_top, width_bottom))

    height_left  = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)
    H            = int(max(height_left, height_right))

    if W < 80 or H < 80:
        log.info("warp: output dimensions too small — skipping")
        return img

    dst = np.array([
        [0,     0    ],
        [W - 1, 0    ],
        [W - 1, H - 1],
        [0,     H - 1],
    ], dtype=np.float32)

    M      = cv2.getPerspectiveTransform(corners, dst)
    warped = cv2.warpPerspective(img, M, (W, H),
                                  flags=cv2.INTER_LINEAR,
                                  borderMode=cv2.BORDER_REPLICATE)
    log.info(f"perspective warp applied — {W}x{H}")
    return warped

# ── Step 4 — CLAHE enhancement ────────────────────────────────────────────────

def clahe_enhance(img: np.ndarray,
                  clip_limit: float = 2.0,
                  tile_size: int = 8) -> np.ndarray:
    """
    CLAHE — Contrast Limited Adaptive Histogram Equalization.

    Unlike global contrast stretch, CLAHE enhances contrast LOCALLY.
    Each tile of the image is equalised independently.
    This makes dark corners bright and bright areas not blown out.

    Applied on L channel of LAB colour space to avoid colour shift.
    """
    # Convert BGR → LAB
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)

    # Apply CLAHE only to L (luminance) channel
    clahe = cv2.createCLAHE(clipLimit=clip_limit,
                             tileGridSize=(tile_size, tile_size))
    l_enhanced = clahe.apply(l)

    # Merge back and convert to BGR
    enhanced_lab = cv2.merge([l_enhanced, a, b])
    result       = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    log.info(f"CLAHE applied — clipLimit={clip_limit} tileSize={tile_size}")
    return result

# ── Step 5 — Sharpen ──────────────────────────────────────────────────────────

def sharpen(img: np.ndarray, strength: float = 1.0) -> np.ndarray:
    """
    Unsharp mask sharpening.
    Subtracts blurred version to boost high-frequency edges (text lines).
    """
    blur   = cv2.GaussianBlur(img, (0, 0), 3)
    sharp  = cv2.addWeighted(img, 1.0 + strength, blur, -strength, 0)
    log.info(f"sharpen applied — strength={strength}")
    return sharp

# ── Pipelines ─────────────────────────────────────────────────────────────────

def process_receipt(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """
    RECEIPT full pipeline:
    1. Denoise   → clean noise before edge detection
    2. Hough     → find 4 dominant lines → intersections = corners
    3. Warp      → perspective correction
    4. CLAHE     → local contrast enhancement
    5. Sharpen   → crisp text edges
    """
    applied: list[str] = []

    # 1. Denoise
    img = denoise(img)
    applied.append("denoise")

    # 2. Corner detection via Hough lines
    corners = find_corners_hough(img)

    # 3. Perspective warp
    if corners is not None:
        img = perspective_warp(img, corners)
        applied.append("perspective_warp")
    else:
        applied.append("no_warp_corners_not_found")

    # 4. CLAHE local contrast
    img = clahe_enhance(img, clip_limit=2.5, tile_size=8)
    applied.append("clahe_enhancement")

    # 5. Sharpen
    img = sharpen(img, strength=0.8)
    applied.append("sharpen")

    return img, applied


def process_odometer(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """
    ODOMETER pipeline:
    1. CLAHE     → local contrast (makes digits pop)
    2. Sharpen   → crisp digit edges
    """
    applied: list[str] = []

    # 1. CLAHE — stronger clip for digits
    img = clahe_enhance(img, clip_limit=3.0, tile_size=6)
    applied.append("clahe_enhancement")

    # 2. Strong sharpen for digit clarity
    img = sharpen(img, strength=1.5)
    applied.append("sharpen")

    return img, applied

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "myexpensio-scan", "version": "2.0.0"}


@app.post("/process", response_model=ProcessResponse)
def process(req: ProcessRequest, x_scan_secret: str = Header(default="")):
    verify_secret(x_scan_secret)
    log.info(f"process — mode={req.mode} b64_len={len(req.image)}")

    try:
        img = b64_to_cv(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decode failed: {e}")

    log.info(f"image decoded — {img.shape[1]}x{img.shape[0]}px")

    try:
        if req.mode == "RECEIPT":
            result, applied = process_receipt(img)
        else:
            result, applied = process_odometer(img)
    except Exception as e:
        log.exception("pipeline failed")
        raise HTTPException(status_code=500, detail=f"Processing error: {e}")

    try:
        b64 = cv_to_b64(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encode failed: {e}")

    h, w = result.shape[:2]
    log.info(f"done — applied={applied} output={w}x{h}")
    return ProcessResponse(result=b64, applied=applied, width=w, height=h)
