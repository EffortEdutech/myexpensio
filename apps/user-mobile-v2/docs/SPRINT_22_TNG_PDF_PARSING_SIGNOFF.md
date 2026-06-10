# Sprint 22 — TNG PDF Parsing — Sign-Off

**Date:** 2026-06-10
**Status:** ✅ COMPLETE (audit-confirmed — no new code required)

---

## Audit Finding

Sprint 22 was planned to build TNG PDF parsing from scratch. Audit of the codebase
revealed the **complete pipeline was already implemented in a prior sprint**.
All deliverables exist and are wired end-to-end.

---

## What Is Already in Place

### Scan Service — `scan_service/main.py` (v5.3.1)
- `POST /parse-tng` endpoint
- Accepts `{ "pdf": "<base64>" }` via JSON body
- Uses `pdfplumber` to extract structured transaction table rows
- Parses columns: Trans No, Entry/Exit datetime, Entry/Exit Location, Amount, Sector
- Returns `{ meta, transactions[], toll_count, parking_count, retail_count }`
- Supports TOLL, PARKING, and RETAIL sectors
- Extracts statement metadata: `account_name`, `ewallet_id`, `period`
- Validates: minimum PDF size, non-empty transactions, sector whitelist

### Backend Route — `apps/user/app/api/tng/parse/route.ts`
- `POST /api/tng/parse` (Next.js, nodejs runtime)
- Auth: cookie-based (PWA) + Bearer token (mobile)
- Accepts `multipart/form-data`, field `"file"`, max 10 MB
- Forwards to scan service as base64 JSON
- Saves original PDF to Supabase Storage: `tng-statements/{user_id}/{upload_id}.pdf`
- Returns: `{ rows, toll_count, parking_count, total_extracted, source_file_path, statement_label, meta, pdf_base64 }`
- `statement_label` derived from `meta.period` (e.g. "01/02/2025 - 28/02/2025") or falls back to "Imported DD MMM YYYY"

### Mobile — `TngScreen.tsx` — `TngImportModal`
Full import flow:
1. `DocumentPicker.getDocumentAsync({ type: "application/pdf" })` — native PDF picker
2. `parsePdf(uri, name, mimeType)` — XHR multipart POST to `${baseUrl}/api/tng/parse`
   - Uses XHR (not fetch) because React Native XHR natively reads `file://` URIs from DocumentPicker cache
   - `Authorization: Bearer <accessToken>` header from `useAuthStore`
   - 2-minute timeout for large PDFs
3. Row preview with select/deselect per transaction
4. `handleSave()` → `saveTngPreview()` → SQLite via `tngRepository`
5. PDF bytes (`pdf_base64`) saved to `documentDirectory/tng-statements/{filename}` via `expo-file-system`
   - Stored as `local://tng/{filename}` in `sourceFileUri`
   - Used by PDF export to attach + highlight the original statement

---

## Parity Status

| Feature | PWA | Mobile V2 |
|---|---|---|
| TNG PDF import | ✅ | ✅ |
| Scan service parser | ✅ | ✅ (shared) |
| Statement storage | ✅ Supabase | ✅ Local + Supabase |
| Row preview before commit | ✅ | ✅ |

---

## Files Confirmed (no changes needed)

| File | Status |
|---|---|
| `scan_service/main.py` | ✅ `/parse-tng` endpoint at v5.3.1 |
| `apps/user/app/api/tng/parse/route.ts` | ✅ Full multipart → scan service → storage |
| `apps/user-mobile-v2/src/features/tng/components/TngScreen.tsx` | ✅ TngImportModal complete |
| `docs/PWA_VS_MOBILEV2_PARITY_TRACKER.md` | ✅ Updated |
| `docs/SPRINT_20_PLUS_ROADMAP.md` | ✅ Sprint 22 marked complete |

---

## Next: Sprint 20-B — EAS Production Build + Play Store Submission

This is the final remaining item. All code and features are complete.
Sprint 20-B requires human DevOps steps:
1. Create Google Play Console account (USD 25 one-time fee)
2. Create app: `com.effortedutech.myexpensio`
3. Download Google Play service account JSON → place at `apps/user-mobile-v2/google-service-account.json`
4. `npx eas-cli login`
5. `npx eas build --profile production --platform android`
6. `npx eas submit --profile production --platform android`
7. Complete Play Store listing (screenshots, description, content rating, privacy policy)
