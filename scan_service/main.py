# scan_service/main.py
# Version: 5.2.0
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
# ODOMETER pipeline:
#   CLAHE → strong sharpen
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

app = FastAPI(title="myexpensio-scan", version="5.2.0", docs_url=None, redoc_url=None)

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
    return {"status": "ok", "service": "myexpensio-scan", "version": "5.2.0"}

# ═════════════════════════════════════════════════════════════════════════════
# IMAGE PROCESSING (unchanged from v5.1)
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
    dst  = np.array([[0,0],[maxW-1,0],[maxW-1,maxH-1],[0,maxH-1]], dtype="float32")
    M    = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(img, M, (maxW, maxH))

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
    applied = []
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    applied.append("clahe")
    kernel = np.array([[-1,-1,-1], [-1, 9,-1], [-1,-1,-1]])
    gray = cv2.filter2D(gray, -1, kernel)
    applied.append("strong_sharpen")
    out = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    return out, applied

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
