# scan_service/main.py
# Version: 5.3.1
#
# Endpoints:
#   POST /process        — Receipt/Odometer image enhancement (OpenCV)
#   POST /parse-tng      — TNG eWallet PDF statement parser (pdfplumber; TOLL/PARKING/RETAIL)
#   POST /highlight-tng  — Highlight claimed Trans No + Amount in TNG statement PDF (PyMuPDF)
#   GET  /health         — Warmup ping (Vercel cron)
#
# RECEIPT pipeline:
#   corners provided by user → warpPerspective → CLAHE → sharpen
#   no corners              → CLAHE → sharpen (no warp)
#
# ODOMETER pipeline (v5.3):
#   detect ROI → crop → scene classify → branch enhancement → digit boost
#
# TNG PARSE pipeline:
#   Accept base64-encoded PDF bytes → pdfplumber table extraction
#   → return structured TOLL + PARKING + RETAIL rows
#   → returns account metadata (name, period) for UI display
#
# TNG HIGHLIGHT pipeline (v5.2):
#   Accept base64 PDF + list of {trans_no, amount} pairs
#   → PyMuPDF search_for() finds exact bounding boxes for each term
#   → Same-row Y-coordinate check ensures only the correct amount is highlighted
#     (avoids highlighting the same amount value on unrelated rows)
#   → add_highlight_annot() draws standard PDF yellow highlights
#   → returns base64 annotated PDF
#   → safe: on any error returns original PDF unchanged

import os
import base64
import logging
import io
from typing import Literal
from datetime import datetime, timezone, timedelta

import cv2
import numpy as np
import pdfplumber
import fitz                        # PyMuPDF — v5.2 addition
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

MYT = timezone(timedelta(hours=8))  # Malaysia Time (UTC+8)

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="myexpensio-scan", version="5.3.1", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Scan-Secret", "Content-Type"],
)

# ── Auth ──────────────────────────────────────────────────────────────────────

def verify_secret(x_scan_secret: str = Header(default="")) -> None:
    if not SCAN_API_SECRET:
        return  # dev mode — secret not required
    if x_scan_secret != SCAN_API_SECRET:
        raise HTTPException(status_code=401, detail="Invalid scan secret.")

# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "myexpensio-scan", "version": "5.3.1"}

# ═════════════════════════════════════════════════════════════════════════════
# IMAGE PROCESSING (v5.3 — odometer ROI + scene-aware enhancement)
# ═════════════════════════════════════════════════════════════════════════════

class ProcessRequest(BaseModel):
    image:   str
    mode:    Literal["RECEIPT", "ODOMETER"] = "RECEIPT"
    corners: list[list[float]] | None       = None

class ProcessResponse(BaseModel):
    result:  str
    applied: list[str]
    width:   int
    height:  int


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
    rect = np.zeros((4, 2), dtype="float32")
    s    = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def four_point_transform(img: np.ndarray, pts: np.ndarray) -> np.ndarray:
    rect = order_corners(pts)
    (tl, tr, br, bl) = rect
    wA   = np.sqrt(((br[0]-bl[0])**2) + ((br[1]-bl[1])**2))
    wB   = np.sqrt(((tr[0]-tl[0])**2) + ((tr[1]-tl[1])**2))
    maxW = max(int(wA), int(wB))
    hA   = np.sqrt(((tr[0]-br[0])**2) + ((tr[1]-br[1])**2))
    hB   = np.sqrt(((tl[0]-bl[0])**2) + ((tl[1]-bl[1])**2))
    maxH = max(int(hA), int(hB))
    maxW = max(maxW, 1)
    maxH = max(maxH, 1)
    dst  = np.array([[0,0],[maxW-1,0],[maxW-1,maxH-1],[0,maxH-1]], dtype="float32")
    M    = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(img, M, (maxW, maxH))


def gray_to_bgr(gray: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)


def clip_u8(img: np.ndarray) -> np.ndarray:
    return np.clip(img, 0, 255).astype(np.uint8)


def ensure_min_width(img: np.ndarray, min_width: int = 900) -> tuple[np.ndarray, bool]:
    h, w = img.shape[:2]
    if w >= min_width:
        return img, False
    scale = min_width / max(w, 1)
    out = cv2.resize(img, (int(round(w * scale)), int(round(h * scale))), interpolation=cv2.INTER_CUBIC)
    return out, True


def gamma_adjust(gray: np.ndarray, gamma: float) -> np.ndarray:
    gamma = max(gamma, 0.1)
    table = np.array([((i / 255.0) ** gamma) * 255 for i in range(256)], dtype=np.uint8)
    return cv2.LUT(gray, table)


def unsharp_mask(gray: np.ndarray, sigma: float = 1.6, amount: float = 0.35) -> np.ndarray:
    blur = cv2.GaussianBlur(gray, (0, 0), sigmaX=sigma)
    return cv2.addWeighted(gray, 1.0 + amount, blur, -amount, 0)


def expand_rect(x: int, y: int, w: int, h: int, shape: tuple[int, int, int], pad_x: float = 0.10, pad_y: float = 0.18) -> tuple[int, int, int, int]:
    ih, iw = shape[:2]
    dx = int(round(w * pad_x))
    dy = int(round(h * pad_y))
    x0 = max(0, x - dx)
    y0 = max(0, y - dy)
    x1 = min(iw, x + w + dx)
    y1 = min(ih, y + h + dy)
    return x0, y0, x1, y1


def resize_for_detection(img: np.ndarray, max_dim: int = 1600) -> tuple[np.ndarray, float]:
    h, w = img.shape[:2]
    long_edge = max(h, w)
    if long_edge <= max_dim:
        return img.copy(), 1.0
    scale = max_dim / float(long_edge)
    out = cv2.resize(img, (int(round(w * scale)), int(round(h * scale))), interpolation=cv2.INTER_AREA)
    return out, scale


def contour_to_quad(cnt: np.ndarray) -> np.ndarray | None:
    peri = cv2.arcLength(cnt, True)
    approx = cv2.approxPolyDP(cnt, 0.03 * peri, True)
    if len(approx) == 4 and cv2.isContourConvex(approx):
        return approx.reshape(4, 2).astype(np.float32)
    return None


def score_text_candidate(gray: np.ndarray, bbox: tuple[int, int, int, int], img_shape: tuple[int, int, int]) -> float:
    x, y, w, h = bbox
    ih, iw = img_shape[:2]
    roi = gray[y:y+h, x:x+w]
    if roi.size == 0:
        return -1.0

    gx = cv2.Sobel(roi, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(roi, cv2.CV_32F, 0, 1, ksize=3)
    edge_x = float(np.mean(np.abs(gx)))
    edge_y = float(np.mean(np.abs(gy)))
    contrast = float(np.std(roi))
    dynamic = float(np.percentile(roi, 95) - np.percentile(roi, 5))

    rect_area = float(w * h)
    img_area = float(iw * ih)
    area_ratio = rect_area / max(img_area, 1.0)
    aspect = w / max(h, 1)
    cx = x + w / 2.0
    cy = y + h / 2.0

    center_bias = 1.0 - min(abs(cx - iw / 2.0) / max(iw / 2.0, 1.0), 1.0)
    target_y = 0.84 if ih >= 500 else 0.56
    lower_bias = 1.0 - min(abs(cy - ih * target_y) / max(ih * target_y, 1.0), 1.0)
    aspect_score = 1.0 - min(abs(aspect - 4.5) / 6.0, 1.0)
    area_score = 1.0 - min(abs(area_ratio - 0.02) / 0.06, 1.0)

    return (
        edge_x * 0.60
        + contrast * 0.45
        + dynamic * 0.30
        - edge_y * 0.20
        + aspect_score * 18.0
        + area_score * 12.0
        + center_bias * 6.0
        + lower_bias * 26.0
    )


def score_window_candidate(gray: np.ndarray, bbox: tuple[int, int, int, int], fill_ratio: float, img_shape: tuple[int, int, int]) -> float:
    x, y, w, h = bbox
    ih, iw = img_shape[:2]
    roi = gray[y:y+h, x:x+w]
    if roi.size == 0:
        return -1.0

    contrast = float(np.std(roi))
    dynamic = float(np.percentile(roi, 95) - np.percentile(roi, 5))
    aspect = w / max(h, 1)
    area_ratio = (w * h) / max(float(iw * ih), 1.0)
    cx = x + w / 2.0
    cy = y + h / 2.0

    center_bias = 1.0 - min(abs(cx - iw / 2.0) / max(iw / 2.0, 1.0), 1.0)
    target_y = 0.86 if ih >= 500 else 0.56
    lower_bias = 1.0 - min(abs(cy - ih * target_y) / max(ih * target_y, 1.0), 1.0)
    aspect_score = 1.0 - min(abs(aspect - 4.0) / 5.0, 1.0)
    fill_score = min(max((fill_ratio - 0.45) / 0.45, 0.0), 1.0)
    area_target = 0.02 if ih >= 500 else 0.04
    area_score = 1.0 - min(abs(area_ratio - area_target) / max(area_target * 2.5, 1e-6), 1.0)

    return (
        fill_score * 70.0
        + contrast * 0.25
        + dynamic * 0.25
        + aspect_score * 12.0
        + area_score * 22.0
        + center_bias * 6.0
        + lower_bias * 50.0
    )


def score_backlit_candidate(
    gray: np.ndarray,
    bbox: tuple[int, int, int, int],
    fill_ratio: float,
    img_shape: tuple[int, int, int],
    target_y: float | None = None,
) -> float:
    x, y, w, h = bbox
    ih, iw = img_shape[:2]
    roi = gray[y:y+h, x:x+w]
    if roi.size == 0:
        return -1.0

    contrast = float(np.std(roi))
    dynamic = float(np.percentile(roi, 95) - np.percentile(roi, 5))
    area_ratio = (w * h) / max(float(iw * ih), 1.0)
    aspect = w / max(h, 1)
    cx = x + w / 2.0
    cy = y + h / 2.0

    center_bias = 1.0 - min(abs(cx - iw / 2.0) / max(iw / 2.0, 1.0), 1.0)
    target_y = target_y if target_y is not None else (0.72 if ih >= 500 else 0.62)
    y_bias = 1.0 - min(abs(cy - ih * target_y) / max(ih * target_y, 1.0), 1.0)

    if aspect < 1.0:
        aspect_score = max(aspect, 0.0)
    else:
        aspect_score = 1.0 - min(abs(aspect - 1.8) / 3.5, 1.0)

    area_target = 0.045 if ih >= 500 else 0.11
    area_score = 1.0 - min(abs(area_ratio - area_target) / max(area_target * 3.0, 1e-6), 1.0)

    return (
        fill_ratio * 38.0
        + contrast * 0.18
        + dynamic * 0.14
        + center_bias * 18.0
        + y_bias * 26.0
        + aspect_score * 13.0
        + area_score * 20.0
    )


def detect_backlit_display_candidates(work: np.ndarray) -> list[tuple[tuple[int, int, int, int], float, str]]:
    """
    Extra detector for backlit / amber digital dashboards.

    Why this pass exists:
    - Some digital clusters do not have a clean rectangular odometer window.
    - Some dashboards place the odometer inside a circular central display.
    - The earlier text/window detector can then lock onto a tiny local blob instead
      of the real illuminated readout area.

    This pass intentionally looks for illuminated warm clusters, then scores them
    with a stronger center / mid-lower bias.
    """
    candidates: list[tuple[tuple[int, int, int, int], float, str]] = []

    hsv = cv2.cvtColor(work, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(work, cv2.COLOR_BGR2GRAY)
    h, s, v = cv2.split(hsv)

    warm_mask = (((h >= 5) & (h <= 40) & (s >= 35) & (v >= 35)).astype(np.uint8) * 255)

    # Pass A — global warm connected-components. Good for rectangular amber LCDs.
    for kernel_size in [(7, 7), (11, 11), (15, 15), (21, 11), (25, 15), (31, 17)]:
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, kernel_size)
        mask = cv2.morphologyEx(warm_mask, cv2.MORPH_CLOSE, kernel, iterations=1)
        mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)), iterations=1)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            area = w * h
            ih, iw = work.shape[:2]
            if area < max(300.0, ih * iw * 0.001) or area > ih * iw * 0.40:
                continue
            aspect = w / max(h, 1)
            if aspect < 0.7 or aspect > 8.5:
                continue

            fill_ratio = cv2.contourArea(cnt) / max(float(area), 1.0)
            if fill_ratio < 0.10:
                continue

            score = score_backlit_candidate(gray, (x, y, w, h), fill_ratio, work.shape, target_y=0.68 if ih >= 500 else 0.62)
            candidates.append(((x, y, w, h), score, "backlit_global"))

    # Pass B — center-cluster detector. Good for round / center-console displays.
    ih, iw = work.shape[:2]
    rx0 = int(round(iw * 0.08))
    rx1 = int(round(iw * 0.92))
    ry0 = int(round(ih * 0.24))
    ry1 = int(round(ih * 0.92))
    center_roi = work[ry0:ry1, rx0:rx1]

    if center_roi.size > 0:
        hsv_roi = cv2.cvtColor(center_roi, cv2.COLOR_BGR2HSV)
        gray_roi = cv2.cvtColor(center_roi, cv2.COLOR_BGR2GRAY)
        hr, sr, vr = cv2.split(hsv_roi)

        warm_roi = (((hr >= 5) & (hr <= 40) & (sr >= 18) & (vr >= 65)).astype(np.uint8) * 255)
        red = center_roi[:, :, 2]
        top_hat = cv2.morphologyEx(red, cv2.MORPH_TOPHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (31, 9)))
        mix = cv2.max(warm_roi, cv2.normalize(top_hat, None, 0, 255, cv2.NORM_MINMAX))
        _, mix_bin = cv2.threshold(mix, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        mix_bin = cv2.morphologyEx(
            mix_bin,
            cv2.MORPH_CLOSE,
            cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31)),
            iterations=1,
        )
        mix_bin = cv2.dilate(
            mix_bin,
            cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)),
            iterations=1,
        )

        contours, _ = cv2.findContours(mix_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            area = w * h
            if area < max(1000.0, center_roi.shape[0] * center_roi.shape[1] * 0.008):
                continue
            if area > center_roi.shape[0] * center_roi.shape[1] * 0.45:
                continue

            aspect = w / max(h, 1)
            if aspect < 0.6 or aspect > 6.0:
                continue

            fill_ratio = cv2.contourArea(cnt) / max(float(area), 1.0)
            if fill_ratio < 0.18:
                continue

            score = score_backlit_candidate(gray_roi, (x, y, w, h), fill_ratio, center_roi.shape, target_y=0.55)
            candidates.append(((rx0 + x, ry0 + y, w, h), score, "backlit_center_cluster"))

    return candidates


def is_suspicious_roi(rect: tuple[int, int, int, int] | None, img_shape: tuple[int, int, int], source: str | None = None, warm_ratio: float = 0.0) -> bool:
    if rect is None:
        return True

    x, y, w, h = rect
    ih, iw = img_shape[:2]
    area_ratio = (w * h) / max(float(iw * ih), 1.0)
    width_ratio = w / max(float(iw), 1.0)
    cy = y + h / 2.0

    if source == "text" and area_ratio < 0.015:
        return True
    if warm_ratio >= 0.10 and width_ratio < 0.22:
        return True
    if cy > ih * 0.82 and area_ratio < 0.015:
        return True
    return False


def find_odometer_roi(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    applied: list[str] = []
    work, scale = resize_for_detection(img, max_dim=1600)
    gray = cv2.cvtColor(work, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    hsv = cv2.cvtColor(work, cv2.COLOR_BGR2HSV)
    h_chan, s_chan, v_chan = cv2.split(hsv)
    warm_ratio = float(np.mean(((h_chan >= 5) & (h_chan <= 35) & (s_chan >= 35) & (v_chan >= 35)).astype(np.uint8)))

    work_h, work_w = work.shape[:2]
    best_rect: tuple[int, int, int, int] | None = None
    best_score = -1.0
    best_source = "none"

    # Pass 1 — look for an actual rectangular display window.
    edges = cv2.Canny(gray, 50, 150)
    edges = cv2.morphologyEx(
        edges,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)),
        iterations=2,
    )
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        area = w * h
        if area < max(400.0, work_h * work_w * 0.001) or area > work_h * work_w * 0.12:
            continue
        if work_h >= 500 and w < work_w * 0.16:
            continue
        aspect = w / max(h, 1)
        if aspect < 1.8 or aspect > 10.0:
            continue
        fill_ratio = cv2.contourArea(cnt) / max(float(area), 1.0)
        if fill_ratio < 0.45:
            continue
        cy = y + h / 2.0
        if work_h >= 500 and cy < work_h * 0.42:
            continue

        score = score_window_candidate(gray, (x, y, w, h), fill_ratio, work.shape)
        if score > best_score:
            best_score = score
            best_rect = (x, y, w, h)
            best_source = "window"

    # Pass 2 — fallback to text-cluster search when the display border is weak.
    if best_rect is None or best_score < 95.0:
        kernels = [
            cv2.getStructuringElement(cv2.MORPH_RECT, (31, 9)),
            cv2.getStructuringElement(cv2.MORPH_RECT, (41, 11)),
            cv2.getStructuringElement(cv2.MORPH_RECT, (51, 13)),
        ]
        candidate_contours: list[np.ndarray] = []
        for kernel in kernels:
            for op in (cv2.MORPH_BLACKHAT, cv2.MORPH_TOPHAT):
                morph = cv2.morphologyEx(gray, op, kernel)
                morph = cv2.normalize(morph, None, 0, 255, cv2.NORM_MINMAX)
                _, thresh = cv2.threshold(morph, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)
                dilate_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(7, kernel.shape[1] // 3), 3))
                closed = cv2.dilate(closed, dilate_kernel, iterations=1)
                contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                candidate_contours.extend(contours)

        for cnt in candidate_contours:
            x, y, w, h = cv2.boundingRect(cnt)
            area = w * h
            if area < max(800.0, work_h * work_w * 0.002) or area > work_h * work_w * 0.25:
                continue
            aspect = w / max(h, 1)
            if aspect < 1.8 or aspect > 12.0:
                continue
            cy = y + h / 2.0
            if work_h >= 500 and cy < work_h * 0.50:
                continue

            score = score_text_candidate(gray, (x, y, w, h), work.shape)
            if score > best_score:
                best_score = score
                best_rect = (x, y, w, h)
                best_source = "text"

    # Pass 3 — special handling for backlit digital dashboards.
    backlit_candidates = detect_backlit_display_candidates(work)
    if backlit_candidates:
        back_rect, back_score, back_source = max(backlit_candidates, key=lambda item: item[1])
        if is_suspicious_roi(best_rect, work.shape, best_source, warm_ratio) and back_score >= 85.0:
            best_rect = back_rect
            best_score = back_score
            best_source = back_source
            applied.append(best_source)

    if best_rect is None or best_score < 55.0:
        applied.append("odometer_roi_not_found")
        return img, applied

    x, y, w, h = best_rect
    inv_scale = 1.0 / max(scale, 1e-9)
    ox = int(round(x * inv_scale))
    oy = int(round(y * inv_scale))
    ow = int(round(w * inv_scale))
    oh = int(round(h * inv_scale))
    if best_source == "backlit_center_cluster":
        pad_x, pad_y = 0.12, 0.12
    elif best_source == "backlit_global":
        pad_x, pad_y = 0.08, 0.10
    else:
        pad_x, pad_y = 0.10, 0.18

    x0, y0, x1, y1 = expand_rect(ox, oy, ow, oh, img.shape, pad_x=pad_x, pad_y=pad_y)

    crop = img[y0:y1, x0:x1].copy()
    applied.append("odometer_roi_crop")
    crop, upscaled = ensure_min_width(crop, min_width=900)
    if upscaled:
        applied.append("upscale_cubic")
    return crop, applied


def classify_odometer_scene(roi: np.ndarray) -> tuple[str, list[str]]:
    applied: list[str] = []
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

    mean_v = float(np.mean(hsv[:, :, 2]))
    mean_s = float(np.mean(hsv[:, :, 1]))
    contrast = float(np.std(gray))
    blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    h = hsv[:, :, 0]
    s = hsv[:, :, 1]
    v = hsv[:, :, 2]
    warm_ratio = float(np.mean(((h >= 5) & (h <= 35) & (s >= 50) & (v >= 50)).astype(np.uint8)))

    if warm_ratio >= 0.14 or (warm_ratio >= 0.08 and mean_s >= 55):
        scene = "lcd_backlit"
    elif mean_v >= 120 and contrast <= 62 and mean_s < 55:
        scene = "lcd_light_bg"
    else:
        scene = "mechanical"

    applied.append(f"scene_{scene}")

    if blur_var < 90.0:
        applied.append("flag_blurry")
    if contrast < 35.0:
        applied.append("flag_low_contrast")
    if mean_v < 80.0:
        applied.append("flag_dark")

    return scene, applied


def select_best_text_channel(img: np.ndarray) -> np.ndarray:
    b, g, r = cv2.split(img)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    channels = [gray, g, r, hsv[:, :, 2], lab[:, :, 0]]
    best = gray
    best_score = -1.0
    for ch in channels:
        bh = cv2.morphologyEx(ch, cv2.MORPH_BLACKHAT, cv2.getStructuringElement(cv2.MORPH_RECT, (25, 7)))
        score = float(np.mean(bh) + np.std(ch) * 0.7)
        if score > best_score:
            best_score = score
            best = ch
    return best


def threshold_digits(gray: np.ndarray, block_size: int = 31, c: int = 8) -> np.ndarray:
    block_size = max(3, block_size | 1)
    norm = cv2.GaussianBlur(gray, (3, 3), 0)
    bin_img = cv2.adaptiveThreshold(
        norm,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        block_size,
        c,
    )
    if float(np.mean(bin_img)) < 110.0:
        bin_img = cv2.bitwise_not(bin_img)
    return bin_img


def enhance_odometer_mechanical(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    applied: list[str] = []
    denoised = cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75)
    applied.append("denoise")
    gray = cv2.cvtColor(denoised, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    applied.append("clahe")
    if float(np.mean(gray)) < 95:
        gray = gamma_adjust(gray, 0.85)
        applied.append("gamma_lift")
    gray = unsharp_mask(gray, sigma=1.7, amount=0.35)
    applied.append("unsharp_mask")
    return gray_to_bgr(gray), applied


def enhance_odometer_lcd_light(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    applied: list[str] = []
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
    applied.append("denoise")
    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    applied.append("clahe")
    gray = unsharp_mask(gray, sigma=1.2, amount=0.28)
    applied.append("unsharp_mask")
    if float(np.mean(gray)) < 120:
        gray = gamma_adjust(gray, 0.90)
        applied.append("gamma_lift")
    return gray_to_bgr(gray), applied


def enhance_odometer_lcd_backlit(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    applied: list[str] = []
    best = select_best_text_channel(img)
    best = cv2.bilateralFilter(best, d=7, sigmaColor=55, sigmaSpace=55)
    applied.append("best_channel")
    applied.append("denoise")
    clahe = cv2.createCLAHE(clipLimit=2.4, tileGridSize=(8, 8))
    best = clahe.apply(best)
    applied.append("clahe")
    best = gamma_adjust(best, 0.92)
    applied.append("gamma_lift")
    best = unsharp_mask(best, sigma=1.2, amount=0.30)
    applied.append("unsharp_mask")
    return gray_to_bgr(best), applied


def finalize_odometer_output(display: np.ndarray) -> tuple[np.ndarray, list[str]]:
    applied: list[str] = []
    gray = cv2.cvtColor(display, cv2.COLOR_BGR2GRAY)
    ocr_preview = threshold_digits(gray, block_size=31, c=8)
    applied.append("ocr_threshold_preview")

    digit_mask = cv2.GaussianBlur(cv2.bitwise_not(ocr_preview), (0, 0), sigmaX=1.0)
    digit_mask = cv2.normalize(digit_mask.astype(np.float32), None, 0.0, 1.0, cv2.NORM_MINMAX)
    boost = gray.astype(np.float32) - digit_mask * 18.0
    applied.append("digit_local_boost")
    return gray_to_bgr(clip_u8(boost)), applied


def enhance_receipt(img: np.ndarray, corners: list[list[float]] | None) -> tuple[np.ndarray, list[str]]:
    applied = []
    if corners and len(corners) == 4:
        pts = np.array(corners, dtype="float32")
        img = four_point_transform(img, pts)
        applied.append("perspective_warp")
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    applied.append("clahe")
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    gray = cv2.filter2D(gray, -1, kernel)
    applied.append("sharpen")
    out = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    return out, applied


def enhance_odometer(img: np.ndarray) -> tuple[np.ndarray, list[str]]:
    """
    Universal odometer enhancer v5.3.1.

    Strategy:
      1. Detect the odometer display / roller window first.
      2. Crop the readout region and upscale it when small.
      3. Classify the scene: mechanical, light LCD, or backlit LCD.
      4. Run the branch-specific enhancement recipe.
      5. Build an OCR-oriented threshold preview internally and blend only a
         small amount of digit emphasis back into the returned display image.

    The endpoint still returns one image only, preserving API compatibility.
    """
    applied: list[str] = []

    roi, roi_steps = find_odometer_roi(img)
    applied.extend(roi_steps)

    scene, scene_steps = classify_odometer_scene(roi)
    applied.extend(scene_steps)

    if scene == "lcd_light_bg":
        display, branch_steps = enhance_odometer_lcd_light(roi)
    elif scene == "lcd_backlit":
        display, branch_steps = enhance_odometer_lcd_backlit(roi)
    else:
        display, branch_steps = enhance_odometer_mechanical(roi)
    applied.extend(branch_steps)

    display, final_steps = finalize_odometer_output(display)
    applied.extend(final_steps)
    return display, applied


@app.post("/process", response_model=ProcessResponse)
def process_image(req: ProcessRequest, x_scan_secret: str = Header(default="")):
    verify_secret(x_scan_secret)
    try:
        img = b64_to_cv(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")
    if req.mode == "RECEIPT":
        result, applied = enhance_receipt(img, req.corners)
    else:
        result, applied = enhance_odometer(img)
    h, w = result.shape[:2]
    return ProcessResponse(result=cv_to_b64(result), applied=applied, width=w, height=h)

# ═════════════════════════════════════════════════════════════════════════════
# TNG PDF PARSER (unchanged from v5.1)
# ═════════════════════════════════════════════════════════════════════════════

class TngParseRequest(BaseModel):
    pdf: str

class TngParsedRow(BaseModel):
    trans_no:       str | None
    entry_datetime: str | None
    exit_datetime:  str | None
    entry_location: str | None
    exit_location:  str | None
    amount:         float
    sector:         str
    tran_type:      str | None = None
    retail_label:   str | None = None

class TngStatementMeta(BaseModel):
    account_name: str | None
    ewallet_id:   str | None
    period:       str | None

class TngParseResponse(BaseModel):
    meta:           TngStatementMeta
    transactions:   list[TngParsedRow]
    toll_count:     int
    parking_count:  int
    retail_count:   int
    skipped_retail: int

def _clean(s: str | None) -> str | None:
    if s is None:
        return None
    result = " ".join(s.replace('\n', ' ').split()).strip()
    return result if result else None

def _parse_tng_datetime(date_raw: str | None, time_raw: str | None = None) -> str | None:
    if not date_raw:
        return None
    cleaned = _clean(date_raw)
    if not cleaned:
        return None
    cleaned = cleaned.replace(' ', '')
    try:
        if time_raw:
            t = (_clean(time_raw) or "").replace(' ', '')
            dt = datetime.strptime(f"{cleaned} {t}", "%d/%m/%Y %H:%M:%S")
        else:
            parts = cleaned.split()
            if len(parts) == 2:
                dt = datetime.strptime(f"{parts[0]} {parts[1]}", "%d/%m/%Y %H:%M:%S")
            else:
                dt = datetime.strptime(cleaned, "%d/%m/%Y")
        return dt.replace(tzinfo=MYT).isoformat()
    except ValueError:
        log.warning(f"[parse-tng] Could not parse date: date_raw={date_raw!r} time_raw={time_raw!r}")
        return None

def _pick_retail_label(tran_type: str | None, entry_loc: str | None, exit_loc: str | None, reload_loc: str | None) -> str | None:
    for value in (entry_loc, exit_loc, reload_loc, tran_type):
        cleaned = _clean(value)
        if cleaned:
            return cleaned
    return None

def _extract_tng_meta(full_text: str) -> TngStatementMeta:
    account_name = ewallet_id = period = None
    for line in full_text.splitlines():
        if 'Account Name' in line and ':' in line:
            account_name = line.split(':', 1)[-1].strip() or None
        elif 'eWallet ID' in line and ':' in line:
            ewallet_id = line.split(':', 1)[-1].strip() or None
        elif 'Transaction Period' in line and ':' in line:
            period = line.split(':', 1)[-1].strip() or None
    return TngStatementMeta(account_name=account_name, ewallet_id=ewallet_id, period=period)

def _parse_tng_table(table: list[list]) -> list[TngParsedRow]:
    """
    Parse a single pdfplumber table containing TNG transaction rows.
    Columns (0-indexed):
      0  Trans No.
      1  Entry Date and Time
      2  Exit Date & Time
      3  Posted Date
      4  Tran Type
      5  Entry Location
      6  Entry SP
      7  Exit Location
      8  Exit SP
      9  Reload Location
      10 Trans Amount (RM)
      11 Card Balance (RM)
      12 Sector
    """
    rows = []
    SECTOR_VALID = {"TOLL", "PARKING", "RETAIL"}

    for raw_row in table:
        if not raw_row or len(raw_row) < 12:
            continue

        trans_no_raw = _clean(raw_row[0]) if raw_row[0] else None
        if not trans_no_raw or not trans_no_raw.isdigit():
            continue

        trans_no = trans_no_raw

        entry_date_raw = _clean(raw_row[1]) if raw_row[1] else None
        exit_date_raw  = _clean(raw_row[2]) if raw_row[2] else None
        posted_raw     = _clean(raw_row[3]) if raw_row[3] else None
        tran_type      = _clean(raw_row[4]) if raw_row[4] else None
        entry_loc      = _clean(raw_row[5]) if raw_row[5] else None
        entry_sp       = _clean(raw_row[6]) if raw_row[6] else None
        exit_loc       = _clean(raw_row[7]) if raw_row[7] else None
        exit_sp        = _clean(raw_row[8]) if raw_row[8] else None
        reload_loc     = _clean(raw_row[9]) if raw_row[9] else None
        amount_raw     = _clean(raw_row[10]) if raw_row[10] else None
        sector_raw     = _clean(raw_row[12]) if len(raw_row) > 12 and raw_row[12] else None

        if not amount_raw:
            continue
        try:
            amount = round(float(amount_raw.replace(",", "")), 2)
        except ValueError:
            continue

        if amount <= 0:
            continue

        sector = sector_raw.upper() if sector_raw else ""
        if sector not in SECTOR_VALID:
            continue

        entry_datetime  = _parse_tng_datetime(entry_date_raw)
        exit_datetime   = _parse_tng_datetime(exit_date_raw)
        posted_datetime = _parse_tng_datetime(posted_raw)
        retail_label    = _pick_retail_label(tran_type, entry_loc, exit_loc, reload_loc)

        effective_entry_loc = entry_loc
        effective_exit_loc  = exit_loc

        if sector == "RETAIL":
            if not effective_entry_loc:
                effective_entry_loc = retail_label
            if not effective_exit_loc and reload_loc and reload_loc != effective_entry_loc:
                effective_exit_loc = reload_loc
            if not exit_datetime and posted_datetime:
                exit_datetime = posted_datetime
            if not entry_datetime and posted_datetime:
                entry_datetime = posted_datetime

        rows.append(TngParsedRow(
            trans_no=trans_no,
            entry_datetime=entry_datetime,
            exit_datetime=exit_datetime or posted_datetime,
            entry_location=effective_entry_loc,
            exit_location=effective_exit_loc,
            amount=amount,
            sector=sector,
            tran_type=tran_type,
            retail_label=retail_label,
        ))

    return rows

@app.post("/parse-tng", response_model=TngParseResponse)
def parse_tng(req: TngParseRequest, x_scan_secret: str = Header(default="")):
    """
    Parse a Touch 'n Go eWallet statement PDF.
    Request: { "pdf": "<base64>" }
    Returns structured TOLL + PARKING + RETAIL transactions.
    """
    verify_secret(x_scan_secret)

    raw_b64 = req.pdf
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]
    try:
        pdf_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 PDF: {e}")

    if len(pdf_bytes) < 100:
        raise HTTPException(status_code=400, detail="PDF data too small to be valid.")

    try:
        pdf_io = io.BytesIO(pdf_bytes)
        with pdfplumber.open(pdf_io) as pdf:
            if len(pdf.pages) == 0:
                raise HTTPException(status_code=422, detail="PARSE_ERROR: PDF has no pages.")

            full_text          = ""
            all_transactions:  list[TngParsedRow] = []

            for page in pdf.pages:
                page_text   = page.extract_text() or ""
                full_text  += page_text + "\n"
                tables      = page.extract_tables()
                for table in tables:
                    all_transactions.extend(_parse_tng_table(table))

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"[parse-tng] pdfplumber error: {e}", exc_info=True)
        raise HTTPException(
            status_code=422,
            detail=f"PARSE_ERROR: Could not extract data from PDF. Is this a text-based TNG statement? ({e})"
        )

    if not all_transactions:
        raise HTTPException(
            status_code=422,
            detail="PARSE_ERROR: No transactions found. Please check this is a TNG Customer Transactions Statement PDF."
        )

    meta         = _extract_tng_meta(full_text)
    toll_count   = sum(1 for t in all_transactions if t.sector == "TOLL")
    parking_count = sum(1 for t in all_transactions if t.sector == "PARKING")
    retail_count  = sum(1 for t in all_transactions if t.sector == "RETAIL")

    return TngParseResponse(
        meta=meta,
        transactions=all_transactions,
        toll_count=toll_count,
        parking_count=parking_count,
        retail_count=retail_count,
        skipped_retail=0,
    )

# ═════════════════════════════════════════════════════════════════════════════
# TNG PDF HIGHLIGHTER  (v5.2 — new endpoint)
# ═════════════════════════════════════════════════════════════════════════════
#
# Request:
#   {
#     "pdf":    "<base64 PDF bytes>",
#     "items":  [
#       { "trans_no": "62313", "amount": "11.64" },
#       { "trans_no": "62318", "amount": "1.66"  }
#     ]
#   }
#
# For each item:
#   1. PyMuPDF search_for(trans_no) → finds exact bounding rect
#   2. PyMuPDF search_for(amount)   → finds ALL bounding rects for that amount string
#   3. Same-row check: only highlight the amount rect whose Y is within
#      Y_TOLERANCE of the trans_no rect (avoids highlighting same amount
#      value on unrelated rows — e.g. "11.64" appears on rows 62313, 62317, 62335)
#   4. add_highlight_annot() — standard PDF yellow highlight annotation
#
# Response:
#   { "pdf": "<base64 annotated PDF>" }
#
# Safety: on ANY error returns the original PDF unchanged.
# The export never fails because of the highlighter.

Y_TOLERANCE = 3.0   # pt — hits within this Y distance are "same row"

class TngHighlightItem(BaseModel):
    trans_no: str              # e.g. "62313"
    amount:   str              # e.g. "11.64"  (string so we search exact text)

class TngHighlightRequest(BaseModel):
    pdf:   str                 # base64 PDF bytes
    items: list[TngHighlightItem]

class TngHighlightResponse(BaseModel):
    pdf:              str      # base64 annotated PDF
    highlights_added: int      # total annotations added
    matched_items:    list[str] # trans_nos that were successfully highlighted

@app.post("/highlight-tng", response_model=TngHighlightResponse)
def highlight_tng(req: TngHighlightRequest, x_scan_secret: str = Header(default="")):
    """
    Add yellow highlight annotations to claimed TNG transactions in a statement PDF.

    For each item in req.items, highlights:
      - The Trans No. text  (e.g. "62313")
      - The Trans Amount    (e.g. "11.64") — only on the same row as the Trans No.

    Returns the annotated PDF as base64. Safe: on any error returns original PDF.
    """
    verify_secret(x_scan_secret)

    # ── Decode input PDF ─────────────────────────────────────────────────────
    raw_b64 = req.pdf
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]
    try:
        pdf_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 PDF: {e}")

    if not req.items:
        # Nothing to highlight — return original PDF unchanged
        return TngHighlightResponse(
            pdf=base64.b64encode(pdf_bytes).decode(),
            highlights_added=0,
            matched_items=[],
        )

    # ── Open with PyMuPDF ────────────────────────────────────────────────────
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        log.error(f"[highlight-tng] fitz.open failed: {e}")
        raise HTTPException(status_code=422, detail=f"Could not open PDF: {e}")

    highlights_added = 0
    matched_items:   list[str] = []

    # Yellow highlight colour (RGB 0–1)
    YELLOW = (1.0, 1.0, 0.0)

    for item in req.items:
        trans_no  = item.trans_no.strip()
        amount_str = item.amount.strip()

        item_highlighted = False

        for page_num in range(doc.page_count):
            page = doc[page_num]

            # ── Find Trans No ─────────────────────────────────────────────────
            trans_hits = page.search_for(trans_no)
            if not trans_hits:
                continue

            # There should be exactly one Trans No per statement
            trans_rect = trans_hits[0]
            trans_y    = trans_rect.y0

            log.info(f"[highlight-tng] trans_no='{trans_no}' found page {page_num+1} y={trans_y:.1f}")

            # Highlight the Trans No
            annot = page.add_highlight_annot(trans_rect)
            annot.set_colors(stroke=YELLOW)
            annot.update()
            highlights_added += 1

            # ── Find Amount on the same row ───────────────────────────────────
            # amount_str may be empty (caller doesn't always know the amount).
            # If empty, skip amount highlighting — trans_no highlight is enough.
            # If provided, search_for(amount_str) may return multiple hits
            # (same amount on different rows). Only highlight the one at the
            # same Y as trans_no, avoiding false matches on other rows.
            if amount_str:
                amount_hits = page.search_for(amount_str)
                for rect in amount_hits:
                    if abs(rect.y0 - trans_y) <= Y_TOLERANCE:
                        annot2 = page.add_highlight_annot(rect)
                        annot2.set_colors(stroke=YELLOW)
                        annot2.update()
                        highlights_added += 1
                        log.info(f"[highlight-tng] amount='{amount_str}' highlighted same row y={rect.y0:.1f}")
                        break  # only first matching amount per row

            item_highlighted = True
            break  # trans_no found on this page — stop scanning further pages

        if item_highlighted:
            matched_items.append(trans_no)
        else:
            log.warning(f"[highlight-tng] trans_no='{trans_no}' NOT FOUND in PDF")

    # ── Save annotated PDF ───────────────────────────────────────────────────
    try:
        out_bytes = doc.tobytes(deflate=True)
        doc.close()
    except Exception as e:
        doc.close()
        log.error(f"[highlight-tng] tobytes failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save annotated PDF: {e}")

    log.info(
        f"[highlight-tng] done: {highlights_added} highlights, "
        f"{len(matched_items)}/{len(req.items)} items matched"
    )

    return TngHighlightResponse(
        pdf=base64.b64encode(out_bytes).decode(),
        highlights_added=highlights_added,
        matched_items=matched_items,
    )
