# scan_service/main.py
# Version: 3.0.0
#
# Advanced OpenCV image processing pipeline for myexpensio.
#
# RECEIPT pipeline:
#   1. Denoise
#   2. Find receipt corners — two strategies in sequence:
#      A. Hough Lines (angle-agnostic) → 2 parallel-pair clusters → intersections
#      B. Bright region fallback → find lightest large blob → bounding quad
#   3. Perspective warp
#   4. CLAHE local contrast
#   5. Sharpen
#
# ODOMETER pipeline:
#   1. CLAHE local contrast
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

app = FastAPI(title="myexpensio-scan", version="3.0.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Scan-Secret", "Content-Type"],
)

# ── Auth ──────────────────────────────────────────────────────────────────────

def verify_secret(x_scan_secret: str = Header(default="")) -> None:
    if not SCAN_API_SECRET:
        return
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

# ── Geometry helpers ──────────────────────────────────────────────────────────

def line_intersection(r1: float, t1: float,
                      r2: float, t2: float) -> tuple[float, float] | None:
    """
    Intersect two lines in Hough (rho, theta) form.
    Returns (x, y) or None if parallel.
    """
    A = np.array([
        [math.cos(t1), math.sin(t1)],
        [math.cos(t2), math.sin(t2)],
    ])
    b = np.array([r1, r2])
    det = np.linalg.det(A)
    if abs(det) < 1e-10:
        return None
    pt = np.linalg.solve(A, b)
    return (float(pt[0]), float(pt[1]))


def order_corners(pts) -> np.ndarray:
    """Order 4 corners: top-left, top-right, bottom-right, bottom-left."""
    arr  = np.array(pts, dtype=np.float32)
    s    = arr.sum(axis=1)
    diff = np.diff(arr, axis=1).flatten()
    tl   = arr[np.argmin(s)]
    br   = arr[np.argmax(s)]
    tr   = arr[np.argmin(diff)]
    bl   = arr[np.argmax(diff)]
    return np.array([tl, tr, br, bl], dtype=np.float32)


def quad_area(corners: np.ndarray) -> float:
    return float(cv2.contourArea(corners.reshape(4, 1, 2).astype(np.float32)))


def corners_valid(corners: np.ndarray,
                  img_w: int, img_h: int,
                  min_area_ratio: float = 0.08) -> bool:
    """
    Reject corners that are wildly outside frame or too small.
    Allow up to 15% outside frame — receipt edges can be cut off.
    """
    margin_x = img_w * 0.15
    margin_y = img_h * 0.15
    for x, y in corners:
        if x < -margin_x or x > img_w + margin_x:
            return False
        if y < -margin_y or y > img_h + margin_y:
            return False
    area = quad_area(corners)
    return area >= img_w * img_h * min_area_ratio

# ── Step 1 — Denoise ──────────────────────────────────────────────────────────

def denoise(img: np.ndarray) -> np.ndarray:
    result = cv2.fastNlMeansDenoisingColored(
        img, None, h=10, hColor=10,
        templateWindowSize=7, searchWindowSize=21
    )
    log.info("denoise done")
    return result

# ── Step 2A — Hough Lines (angle-agnostic) ────────────────────────────────────

def cluster_by_angle(lines: list[tuple[float, float]],
                     angle_thresh_deg: float = 15.0
                     ) -> list[list[tuple[float, float]]]:
    """
    Group Hough lines into clusters of similar angle.
    Receipt has 2 pairs of parallel sides → expect 2 dominant angle clusters.
    Works at ANY angle — diagonal receipts included.
    """
    clusters: list[list[tuple[float, float]]] = []
    thresh   = math.radians(angle_thresh_deg)

    for rho, theta in lines:
        placed = False
        for cluster in clusters:
            rep_theta = cluster[0][1]
            # Hough theta wraps at π — handle wrap-around
            diff = abs(theta - rep_theta)
            diff = min(diff, math.pi - diff)
            if diff < thresh:
                cluster.append((rho, theta))
                placed = True
                break
        if not placed:
            clusters.append([(rho, theta)])

    return clusters


def best_line_pair(cluster: list[tuple[float, float]],
                   img_w: int, img_h: int
                   ) -> tuple[tuple, tuple] | None:
    """
    From a cluster of parallel lines, pick the pair that are
    most separated (= the two opposite edges of the receipt).
    """
    if len(cluster) < 2:
        return None

    # Sort by rho (signed distance from origin)
    sorted_lines = sorted(cluster, key=lambda l: l[0])

    # Best pair = max rho separation
    best_sep  = 0.0
    best_pair = None

    for l1, l2 in combinations(sorted_lines, 2):
        sep = abs(l1[0] - l2[0])
        if sep > best_sep:
            best_sep  = sep
            best_pair = (l1, l2)

    return best_pair


def find_corners_hough(img: np.ndarray) -> np.ndarray | None:
    """
    Angle-agnostic Hough corner detection.

    Key insight: do NOT assume receipt is axis-aligned.
    Instead find all strong lines, cluster by angle,
    take the TWO largest angle clusters (the two pairs of sides),
    pick the two most-separated lines from each cluster,
    intersect them to get 4 corners.
    """
    h, w = img.shape[:2]
    scale = min(1.0, 1200.0 / max(h, w))
    work  = cv2.resize(img, (int(w * scale), int(h * scale)))
    wh, ww = work.shape[:2]

    gray = cv2.cvtColor(work, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # Auto Canny via Otsu threshold
    otsu, _ = cv2.threshold(blur, 0, 255,
                            cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    edges   = cv2.Canny(blur,
                        threshold1=otsu * 0.3,
                        threshold2=otsu)

    # Try to detect lines — lower threshold progressively
    raw = None
    for thresh in [100, 80, 60, 40]:
        raw = cv2.HoughLines(edges, rho=1, theta=np.pi / 180,
                             threshold=thresh)
        if raw is not None and len(raw) >= 4:
            break

    if raw is None or len(raw) < 4:
        log.info("Hough: not enough lines detected")
        return None

    # Flatten to list of (rho, theta)
    lines = [(float(l[0][0]), float(l[0][1])) for l in raw]
    log.info(f"Hough: {len(lines)} raw lines")

    # Cluster by angle — angle-agnostic
    clusters = cluster_by_angle(lines, angle_thresh_deg=15.0)
    clusters = sorted(clusters, key=len, reverse=True)  # largest first
    log.info(f"Hough: {len(clusters)} angle clusters, sizes={[len(c) for c in clusters[:4]]}")

    if len(clusters) < 2:
        log.info("Hough: need at least 2 angle clusters")
        return None

    # Try combinations of the top clusters
    best_corners = None
    best_area    = 0.0

    for ci, cj in combinations(range(min(4, len(clusters))), 2):
        pair_i = best_line_pair(clusters[ci], ww, wh)
        pair_j = best_line_pair(clusters[cj], ww, wh)
        if pair_i is None or pair_j is None:
            continue

        # 4 corners = intersections of every line in pair_i with every in pair_j
        pts = []
        for li in pair_i:
            for lj in pair_j:
                pt = line_intersection(li[0], li[1], lj[0], lj[1])
                if pt is not None:
                    pts.append(pt)

        if len(pts) != 4:
            continue

        ordered = order_corners(pts)

        if not corners_valid(ordered, ww, wh, min_area_ratio=0.08):
            continue

        area = quad_area(ordered)
        if area > best_area:
            best_area    = area
            best_corners = ordered

    if best_corners is None:
        log.info("Hough: no valid quad found")
        return None

    # Scale back to original resolution
    best_corners = best_corners / scale
    log.info(f"Hough: corners found — area={best_area:.0f}px²")
    return best_corners

# ── Step 2B — Bright region fallback ─────────────────────────────────────────

def find_corners_bright_region(img: np.ndarray) -> np.ndarray | None:
    """
    Fallback for white receipts on darker backgrounds.

    Receipt paper is bright (high L in LAB).
    Background (table, hand, floor) is darker.

    Pipeline:
    1. Convert to LAB → extract L channel
    2. Otsu threshold → bright regions
    3. Morphological close to fill receipt body
    4. Find largest bright contour
    5. Approximate to quadrilateral
    """
    h, w = img.shape[:2]
    scale = min(1.0, 1200.0 / max(h, w))
    work  = cv2.resize(img, (int(w * scale), int(h * scale)))
    wh, ww = work.shape[:2]

    # Extract brightness
    lab      = cv2.cvtColor(work, cv2.COLOR_BGR2LAB)
    l_chan   = lab[:, :, 0]

    # Threshold: keep only bright pixels
    _, bright = cv2.threshold(l_chan, 0, 255,
                               cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Close gaps (receipt has text which creates dark patches)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    closed = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, kernel, iterations=3)
    filled = cv2.morphologyEx(closed, cv2.MORPH_DILATE, kernel, iterations=2)

    contours, _ = cv2.findContours(filled, cv2.RETR_EXTERNAL,
                                    cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        log.info("bright region: no contours")
        return None

    min_area = ww * wh * 0.08
    contours  = sorted(contours, key=cv2.contourArea, reverse=True)

    for cnt in contours[:5]:
        if cv2.contourArea(cnt) < min_area:
            break
        # Try progressive epsilon to get 4-point approximation
        for eps in [0.01, 0.02, 0.03, 0.05, 0.08]:
            peri   = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, eps * peri, True)
            if len(approx) == 4:
                corners = approx.reshape(4, 2).astype(np.float32) / scale
                ordered = order_corners(corners)
                if corners_valid(ordered, w, h, min_area_ratio=0.06):
                    log.info("bright region: 4-corner quad found")
                    return ordered
        # Convex hull fallback
        hull = cv2.convexHull(cnt)
        for eps in [0.01, 0.02, 0.04, 0.06]:
            peri   = cv2.arcLength(hull, True)
            approx = cv2.approxPolyDP(hull, eps * peri, True)
            if len(approx) == 4:
                corners = approx.reshape(4, 2).astype(np.float32) / scale
                ordered = order_corners(corners)
                if corners_valid(ordered, w, h, min_area_ratio=0.06):
                    log.info("bright region (hull): 4-corner quad found")
                    return ordered

    log.info("bright region: no valid quad")
    return None

# ── Step 3 — Perspective warp ─────────────────────────────────────────────────

def perspective_warp(img: np.ndarray, corners: np.ndarray) -> np.ndarray:
    tl, tr, br, bl = corners

    W = int(max(np.linalg.norm(tr - tl), np.linalg.norm(br - bl)))
    H = int(max(np.linalg.norm(bl - tl), np.linalg.norm(br - tr)))

    if W < 80 or H < 80:
        log.info("warp: output too small — skipping")
        return img

    dst = np.array([
        [0,     0    ],
        [W - 1, 0    ],
        [W - 1, H - 1],
        [0,     H - 1],
    ], dtype=np.float32)

    M      = cv2.getPerspectiveTransform(corners, dst)
    warped = cv2.warpPerspective(img, M, (W, H),
                                  flags=cv2.INTER_LANCZOS4,
                                  borderMode=cv2.BORDER_REPLICATE)
    log.info(f"perspective warp done — {W}x{H}")
    return warped

# ── Step 4 — CLAHE ────────────────────────────────────────────────────────────

def clahe_enhance(img: np.ndarray,
                  clip_limit: float = 2.0,
                  tile_size: int = 8) -> np.ndarray:
    """
    Contrast Limited Adaptive Histogram Equalization on L channel (LAB).
    Enhances local contrast without blowing out bright areas.
    """
    lab          = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b      = cv2.split(lab)
    clahe        = cv2.createCLAHE(clipLimit=clip_limit,
                                   tileGridSize=(tile_size, tile_size))
    l_enh        = clahe.apply(l)
    result       = cv2.cvtColor(cv2.merge([l_enh, a, b]), cv2.COLOR_LAB2BGR)
    log.info(f"CLAHE done — clip={clip_limit} tile={tile_size}")
    return result

# ── Step 5 — Sharpen ──────────────────────────────────────────────────────────

def sharpen(img: np.ndarray, strength: float = 1.0) -> np.ndarray:
    blur   = cv2.GaussianBlur(img, (0, 0), 3)
    result = cv2.addWeighted(img, 1.0 + strength, blur, -strength, 0)
    log.info(f"sharpen done — strength={strength}")
    return result

# ── Pipelines ─────────────────────────────────────────────────────────────────

def process_receipt(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    applied: list[str] = []

    # 1. Denoise
    img = denoise(img)
    applied.append("denoise")

    # 2. Corner detection — Hough first, bright region fallback
    corners = find_corners_hough(img)
    strategy = "hough"

    if corners is None:
        log.info("Hough failed — trying bright region fallback")
        corners  = find_corners_bright_region(img)
        strategy = "bright_region"

    # 3. Perspective warp
    if corners is not None:
        img = perspective_warp(img, corners)
        applied.append(f"perspective_warp_{strategy}")
    else:
        log.info("both strategies failed — no warp")
        applied.append("no_warp_corners_not_found")

    # 4. CLAHE
    img = clahe_enhance(img, clip_limit=2.5, tile_size=8)
    applied.append("clahe_enhancement")

    # 5. Sharpen
    img = sharpen(img, strength=0.8)
    applied.append("sharpen")

    return img, applied


def process_odometer(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    applied: list[str] = []
    img = clahe_enhance(img, clip_limit=3.0, tile_size=6)
    applied.append("clahe_enhancement")
    img = sharpen(img, strength=1.5)
    applied.append("sharpen")
    return img, applied

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "myexpensio-scan", "version": "3.0.0"}


@app.post("/process", response_model=ProcessResponse)
def process(req: ProcessRequest, x_scan_secret: str = Header(default="")):
    verify_secret(x_scan_secret)
    log.info(f"process — mode={req.mode}")

    try:
        img = b64_to_cv(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Decode failed: {e}")

    log.info(f"image {img.shape[1]}x{img.shape[0]}px")

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
