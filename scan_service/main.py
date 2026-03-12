# scan_service/main.py
# Version: 5.1.0
#
# Endpoints:
#   POST /process        — Receipt/Odometer image enhancement (OpenCV)
#   POST /parse-tng      — TNG eWallet PDF statement parser (pdfplumber; TOLL/PARKING/RETAIL)
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

import os
import base64
import logging
import io
from typing import Literal
from datetime import datetime, timezone, timedelta

import cv2
import numpy as np
import pdfplumber
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

app = FastAPI(title="myexpensio-scan", version="5.1.0", docs_url=None, redoc_url=None)

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
    return {"status": "ok", "service": "myexpensio-scan", "version": "5.1.0"}

# ═════════════════════════════════════════════════════════════════════════════
# IMAGE PROCESSING (existing — unchanged from v4)
# ═════════════════════════════════════════════════════════════════════════════

class ProcessRequest(BaseModel):
    image:   str                                      # base64 JPEG
    mode:    Literal["RECEIPT", "ODOMETER"] = "RECEIPT"
    corners: list[list[float]] | None       = None   # [[x,y]*4] TL,TR,BR,BL in original px

class ProcessResponse(BaseModel):
    result:  str          # base64 JPEG
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
    """Order 4 points: TL, TR, BR, BL."""
    rect = np.zeros((4, 2), dtype="float32")
    s    = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]      # TL
    rect[2] = pts[np.argmax(s)]      # BR
    rect[1] = pts[np.argmin(diff)]   # TR
    rect[3] = pts[np.argmax(diff)]   # BL
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
    dst  = np.array([
        [0, 0], [maxW-1, 0], [maxW-1, maxH-1], [0, maxH-1]
    ], dtype="float32")
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
    return ProcessResponse(
        result=cv_to_b64(result),
        applied=applied,
        width=w,
        height=h,
    )

# ═════════════════════════════════════════════════════════════════════════════
# TNG PDF PARSER (new in v5)
# ═════════════════════════════════════════════════════════════════════════════

class TngParseRequest(BaseModel):
    pdf: str  # base64-encoded PDF bytes (no data-URI prefix needed, but handled if present)

class TngParsedRow(BaseModel):
    trans_no:       str | None
    entry_datetime: str | None   # ISO 8601 with MYT offset (+08:00)
    exit_datetime:  str | None
    entry_location: str | None
    exit_location:  str | None
    amount:         float        # MYR, 2 decimal precision
    sector:         str          # "TOLL" | "PARKING" | "RETAIL"
    tran_type:      str | None = None
    retail_label:   str | None = None

class TngStatementMeta(BaseModel):
    account_name: str | None
    ewallet_id:   str | None
    period:       str | None

class TngParseResponse(BaseModel):
    meta:         TngStatementMeta
    transactions: list[TngParsedRow]
    toll_count:    int
    parking_count: int
    retail_count:  int
    skipped_retail: int  # retained for backward compatibility; 0 in v5.1+

def _clean(s: str | None) -> str | None:
    """Normalise multi-line cell text to single-line, collapse whitespace."""
    if s is None:
        return None
    result = " ".join(s.replace('\n', ' ').split()).strip()
    return result if result else None

def _parse_tng_datetime(date_raw: str | None, time_raw: str | None = None) -> str | None:
    """
    Parse TNG date strings like:
      "24/02/2026"
      "24/02\n/2026"  (multi-line from cell)
      "22/02/2026 15:44:07"  (combined in single cell)
    Returns ISO 8601 with MYT offset, or None on failure.
    """
    if not date_raw:
        return None
    cleaned = _clean(date_raw)
    if not cleaned:
        return None
    # Remove spaces — handles "24/02 /2026" artifact
    cleaned = cleaned.replace(' ', '')

    try:
        if time_raw:
            t = (_clean(time_raw) or "").replace(' ', '')
            dt = datetime.strptime(f"{cleaned} {t}", "%d/%m/%Y %H:%M:%S")
        else:
            # Try combined datetime first ("22/02/2026 15:44:07")
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
    """Best-effort human label for RETAIL transport rows."""
    for value in (entry_loc, exit_loc, reload_loc, tran_type):
        cleaned = _clean(value)
        if cleaned:
            return cleaned
    return None

def _extract_tng_meta(full_text: str) -> TngStatementMeta:
    """Extract header fields from raw PDF text."""
    account_name = ewallet_id = period = None
    for line in full_text.splitlines():
        if 'Account Name' in line and ':' in line:
            account_name = line.split(':', 1)[-1].strip() or None
        elif 'eWallet ID' in line and ':' in line:
            ewallet_id = line.split(':', 1)[-1].strip() or None
        elif 'Transaction Period' in line and ':' in line:
            period = line.split(':', 1)[-1].strip() or None
    return TngStatementMeta(
        account_name=account_name,
        ewallet_id=ewallet_id,
        period=period,
    )

def _parse_tng_table(table: list[list]) -> list[TngParsedRow]:
    """
    Parse a single pdfplumber table that contains TNG transaction rows.
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
    rows: list[TngParsedRow] = []

    if not table or len(table) < 2:
        return rows

    header_0 = _clean(table[0][0]) or ""
    if "Trans No" not in header_0:
        return rows

    for raw_row in table[1:]:
        if len(raw_row) < 13:
            continue

        trans_no     = _clean(raw_row[0])
        entry_raw    = raw_row[1]
        exit_raw     = raw_row[2]
        posted_raw   = raw_row[3]
        tran_type    = _clean(raw_row[4])
        entry_loc    = _clean(raw_row[5])
        exit_loc     = _clean(raw_row[7])
        reload_loc   = _clean(raw_row[9])
        amount_raw   = _clean(raw_row[10])
        sector_raw   = _clean(raw_row[12])

        sector = (sector_raw or "").upper()
        if sector not in ("TOLL", "PARKING", "RETAIL"):
            continue

        try:
            amount = round(float((amount_raw or "0").replace(',', '')), 2)
        except ValueError:
            log.warning(f"[parse-tng] Could not parse amount: {amount_raw!r} for trans {trans_no}")
            continue
        if amount <= 0:
            continue

        exit_parts = str(exit_raw or "").split('\n')
        if len(exit_parts) == 2:
            exit_datetime = _parse_tng_datetime(exit_parts[0], exit_parts[1])
        else:
            exit_datetime = _parse_tng_datetime(_clean(exit_raw))

        entry_clean = _clean(entry_raw)
        entry_parts = (entry_clean or "").split(' ')
        if entry_clean and len(entry_parts) >= 2 and ':' in entry_parts[-1]:
            entry_datetime = _parse_tng_datetime(entry_parts[0], entry_parts[-1])
        elif entry_clean:
            entry_datetime = _parse_tng_datetime(entry_clean)
        else:
            entry_datetime = None

        posted_datetime = _parse_tng_datetime(_clean(posted_raw))

        retail_label = _pick_retail_label(tran_type, entry_loc, exit_loc, reload_loc)
        effective_entry_loc = entry_loc
        effective_exit_loc = exit_loc

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

    Request body:
      { "pdf": "<base64-encoded PDF bytes>" }

    Supports both:
      - Raw base64
      - Data URI: "data:application/pdf;base64,<data>"

    Returns structured TOLL + PARKING + RETAIL transactions.
    """
    verify_secret(x_scan_secret)

    # ── Decode PDF bytes ──────────────────────────────────────────────────────
    raw_b64 = req.pdf
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]
    try:
        pdf_bytes = base64.b64decode(raw_b64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 PDF: {e}")

    if len(pdf_bytes) < 100:
        raise HTTPException(status_code=400, detail="PDF data too small to be valid.")

    # ── Open with pdfplumber ──────────────────────────────────────────────────
    try:
        pdf_io = io.BytesIO(pdf_bytes)
        with pdfplumber.open(pdf_io) as pdf:
            if len(pdf.pages) == 0:
                raise HTTPException(status_code=422, detail="PARSE_ERROR: PDF has no pages.")

            # Collect full text for metadata
            full_text = ""
            all_transactions: list[TngParsedRow] = []
            skipped_retail = 0

            for page in pdf.pages:
                page_text = page.extract_text() or ""
                full_text += page_text + "\n"

                tables = page.extract_tables()
                for table in tables:
                    parsed = _parse_tng_table(table)
                    all_transactions.extend(parsed)

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"[parse-tng] pdfplumber error: {e}", exc_info=True)
        raise HTTPException(
            status_code=422,
            detail=f"PARSE_ERROR: Could not extract data from PDF. Is this a text-based TNG statement? Error: {e}"
        )

    if not all_transactions:
        raise HTTPException(
            status_code=422,
            detail="PARSE_ERROR: No TOLL, PARKING, or RETAIL transactions found. "
                   "Please upload a TNG eWallet Customer Transactions Statement PDF."
        )

    meta = _extract_tng_meta(full_text)

    toll_count    = sum(1 for t in all_transactions if t.sector == "TOLL")
    parking_count = sum(1 for t in all_transactions if t.sector == "PARKING")
    retail_count  = sum(1 for t in all_transactions if t.sector == "RETAIL")

    log.info(
        f"[parse-tng] Parsed {len(all_transactions)} transactions "
        f"(TOLL={toll_count}, PARKING={parking_count}, RETAIL={retail_count}) "
        f"for account={meta.account_name!r}"
    )

    return TngParseResponse(
        meta=meta,
        transactions=all_transactions,
        toll_count=toll_count,
        parking_count=parking_count,
        retail_count=retail_count,
        skipped_retail=0,
    )
