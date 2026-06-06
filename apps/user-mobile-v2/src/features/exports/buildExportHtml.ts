/**
 * buildExportHtml.ts
 *
 * Generates a self-contained HTML string from an ExportPreviewPayload.
 * Designed to be passed directly to expo-print's printToFileAsync().
 *
 * Layout mirrors V1 pdf-builder.ts:
 *   - Header bar (dark brand)
 *   - Claimant / meta block
 *   - Claims summary table
 *   - Items detail table (grouped by claim, sorted by date)
 *   - TNG appendix notice (list of linked statements)
 *   - Declaration footer
 *
 * All CSS is inline / in a <style> block — no external resources.
 * Uses A4 @page size so expo-print paginates correctly on iOS and Android.
 */

import type { ExportPreviewPayload, TngAppendixPreview } from "@/features/exports/types";

const ACCENT = "#0f172a";
const MUTED  = "#64748b";
const BORDER = "#e2e8f0";
const LIGHT  = "#f8fafc";

// ── Public entry ──────────────────────────────────────────────────────────────

export function buildExportHtml(
  payload: ExportPreviewPayload,
  appendices: TngAppendixPreview[],
  options: {
    claimerName?: string;
    orgName?: string;
  } = {}
): string {
  const { claimerName = "Claimant", orgName = "myexpensio" } = options;
  const generatedAt = new Date(payload.generatedAt).toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const grandTotalCents = payload.claims.reduce((s, c) => s + c.totalAmountCents, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Expense Claim — myexpensio</title>
<style>
  @page { size: A4 portrait; margin: 14mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; color: #0f172a; }

  /* ── Header ── */
  .hdr { background: ${ACCENT}; color: #fff; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; }
  .hdr-brand { font-size: 15pt; font-weight: 700; }
  .hdr-right { text-align: right; }
  .hdr-title { font-size: 8pt; opacity: .65; letter-spacing: .06em; }
  .hdr-sub   { font-size: 7pt; opacity: .4; }

  /* ── Meta block ── */
  .meta { display: flex; border: 1px solid ${BORDER}; margin-top: 10px; }
  .meta-left  { flex: 1; padding: 10px 12px; border-right: 1px solid ${BORDER}; }
  .meta-right { width: 210px; padding: 10px 12px; }
  .meta-name  { font-size: 12pt; font-weight: 700; margin-bottom: 3px; }
  .meta-sub   { font-size: 7.5pt; color: ${MUTED}; margin-bottom: 2px; }
  .meta-kv    { display: flex; gap: 8px; margin-bottom: 5px; }
  .meta-label { font-size: 7pt; font-weight: 700; color: ${MUTED}; text-transform: uppercase; letter-spacing: .05em; min-width: 72px; }
  .meta-val   { font-size: 8.5pt; }
  .meta-total { font-size: 11pt; font-weight: 700; }

  /* ── Section heading ── */
  .sec-title { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: ${MUTED}; margin: 14px 0 5px; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  th { background: ${ACCENT}; color: #fff; font-size: 7.5pt; font-weight: 700; padding: 5px 6px; text-align: left; }
  th.r { text-align: right; }
  td { padding: 4px 6px; border-bottom: 1px solid ${BORDER}; vertical-align: top; }
  td.r { text-align: right; }
  tr.alt td { background: ${LIGHT}; }
  tr.subtotal td { background: #e2e8f0; font-weight: 700; }
  tr.grand td { background: #cbd5e1; font-weight: 700; font-size: 9pt; }

  /* ── Claim group header ── */
  .claim-hdr { background: #e2e8f0; padding: 5px 8px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center; }
  .claim-hdr-title { font-weight: 700; font-size: 9pt; }
  .claim-hdr-status { font-size: 7.5pt; color: ${MUTED}; }

  /* ── TNG appendix notice ── */
  .tng-box { border: 1px solid #bfdbfe; background: #eff6ff; border-radius: 4px; padding: 10px 12px; margin-top: 14px; }
  .tng-box-title { font-size: 9pt; font-weight: 700; color: #1e3a8a; margin-bottom: 6px; }
  .tng-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #dbeafe; font-size: 8pt; }
  .tng-row:last-child { border-bottom: none; }
  .tng-label { color: #1e40af; }
  .tng-meta  { color: ${MUTED}; font-size: 7.5pt; }
  .tng-pdf-badge { font-size: 7pt; background: #1e40af; color: #fff; border-radius: 3px; padding: 1px 5px; margin-left: 6px; }
  .tng-nopdf-badge { font-size: 7pt; background: #94a3b8; color: #fff; border-radius: 3px; padding: 1px 5px; margin-left: 6px; }

  /* ── Declaration ── */
  .declaration { border-top: 1px solid ${BORDER}; margin-top: 20px; padding-top: 12px; }
  .declaration-title { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: ${MUTED}; margin-bottom: 6px; }
  .declaration-body  { font-size: 8pt; color: #334155; line-height: 1.55; margin-bottom: 14px; }
  .sig-block { display: flex; gap: 24px; margin-top: 8px; }
  .sig-field { flex: 1; }
  .sig-line  { border-bottom: 1px solid ${BORDER}; height: 34px; margin-bottom: 4px; }
  .sig-label { font-size: 7pt; color: ${MUTED}; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
  .sig-value { font-size: 8.5pt; margin-top: 2px; }
  .footer-note { font-size: 6.5pt; color: #94a3b8; text-align: center; margin-top: 14px; font-style: italic; }
</style>
</head>
<body>

${renderHeader(orgName)}
${renderMeta(claimerName, orgName, generatedAt, payload.claims.length, grandTotalCents)}
${renderSummaryTable(payload)}
${renderItemsDetail(payload)}
${appendices.length > 0 ? renderTngNotice(appendices) : ""}
${renderDeclaration(claimerName, orgName, generatedAt)}

</body>
</html>`;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderHeader(orgName: string): string {
  return `
<div class="hdr">
  <div class="hdr-brand">${esc(orgName)}</div>
  <div class="hdr-right">
    <div class="hdr-title">EXPENSE CLAIM FORM</div>
    <div class="hdr-sub">Mileage &amp; Claims Automation</div>
  </div>
</div>`;
}

function renderMeta(
  name: string,
  org: string,
  generatedAt: string,
  claimCount: number,
  grandTotalCents: number
): string {
  return `
<div class="meta">
  <div class="meta-left">
    <div class="meta-sub">CLAIMANT</div>
    <div class="meta-name">${esc(name)}</div>
    <div class="meta-sub">${esc(org)}</div>
  </div>
  <div class="meta-right">
    <div class="meta-kv"><span class="meta-label">GENERATED</span><span class="meta-val">${esc(generatedAt)}</span></div>
    <div class="meta-kv"><span class="meta-label">CLAIMS</span><span class="meta-val">${claimCount}</span></div>
    <div class="meta-kv"><span class="meta-label">GRAND TOTAL</span><span class="meta-total">MYR ${fmt(grandTotalCents)}</span></div>
  </div>
</div>`;
}

function renderSummaryTable(payload: ExportPreviewPayload): string {
  const rows = payload.claims.map((c, i) => `
    <tr class="${i % 2 === 0 ? "" : "alt"}">
      <td>${esc(c.title ?? periodLabel(c.periodStart, c.periodEnd))}</td>
      <td>${esc(periodLabel(c.periodStart, c.periodEnd))}</td>
      <td style="text-align:center">${esc(c.status)}</td>
      <td style="text-align:center">${c.itemCount}</td>
      <td class="r">MYR ${fmt(c.totalAmountCents)}</td>
    </tr>`).join("");

  const grandCents = payload.claims.reduce((s, c) => s + c.totalAmountCents, 0);

  return `
<div class="sec-title">Claims included in this export</div>
<table>
  <thead><tr>
    <th>Claim / Title</th><th>Period</th>
    <th style="text-align:center">Status</th>
    <th style="text-align:center">Items</th>
    <th class="r">Total (MYR)</th>
  </tr></thead>
  <tbody>
    ${rows}
    <tr class="grand">
      <td colspan="4">GRAND TOTAL</td>
      <td class="r">MYR ${fmt(grandCents)}</td>
    </tr>
  </tbody>
</table>`;
}

function renderItemsDetail(payload: ExportPreviewPayload): string {
  // Group rows by claim
  const claimOrder = payload.claims.map((c) => c.id);
  const byClaimId = new Map<string, typeof payload.rows>();

  for (const row of payload.rows) {
    const arr = byClaimId.get(row.claimId) ?? [];
    arr.push(row);
    byClaimId.set(row.claimId, arr);
  }

  const sections = claimOrder.map((cid) => {
    const claim = payload.claims.find((c) => c.id === cid);
    if (!claim) return "";
    const items = byClaimId.get(cid) ?? [];

    const itemRows = items.map((item, i) => {
      const chips: string[] = [];
      if (item.receiptPresent) chips.push('<span style="font-size:7pt;background:#dcfce7;color:#166534;border-radius:3px;padding:1px 4px">🧾</span>');
      if (item.paidViaTng)    chips.push('<span style="font-size:7pt;background:#dbeafe;color:#1e40af;border-radius:3px;padding:1px 4px">TNG</span>');

      return `
      <tr class="${i % 2 === 0 ? "" : "alt"}">
        <td>${esc(fmtDate(item.itemDate))}</td>
        <td>${esc(item.itemType.toLowerCase())}</td>
        <td>${esc(item.title)}${chips.length ? " " + chips.join(" ") : ""}</td>
        <td>${item.tngTransNo ? esc(item.tngTransNo) : "—"}</td>
        <td class="r">MYR ${fmt(item.amountCents)}</td>
      </tr>`;
    }).join("");

    const subtotal = items.reduce((s, r) => s + r.amountCents, 0);

    return `
  <div class="claim-hdr">
    <span class="claim-hdr-title">${esc(claim.title ?? periodLabel(claim.periodStart, claim.periodEnd))}</span>
    <span class="claim-hdr-status">${esc(periodLabel(claim.periodStart, claim.periodEnd))} · ${esc(claim.status)}</span>
  </div>
  <table>
    <thead><tr>
      <th style="width:70px">Date</th>
      <th style="width:72px">Type</th>
      <th>Description</th>
      <th style="width:72px">TNG Trans No</th>
      <th class="r" style="width:90px">Amount (MYR)</th>
    </tr></thead>
    <tbody>
      ${itemRows}
      <tr class="subtotal">
        <td colspan="4">Subtotal — ${esc(claim.title ?? "")}</td>
        <td class="r">MYR ${fmt(subtotal)}</td>
      </tr>
    </tbody>
  </table>`;
  }).join("");

  return `
<div class="sec-title">Claim items detail</div>
${sections}`;
}

function renderTngNotice(appendices: TngAppendixPreview[]): string {
  const rows = appendices.map((a) => `
  <div class="tng-row">
    <div>
      <span class="tng-label">${esc(a.statementLabel)}</span>
      ${a.hasSourcePdf
        ? '<span class="tng-pdf-badge">PDF attached</span>'
        : '<span class="tng-nopdf-badge">PDF pending</span>'}
    </div>
    <div>
      <span class="tng-meta">${a.transactionCount} row(s) · MYR ${fmt(a.totalAmountCents)}</span>
    </div>
  </div>`).join("");

  return `
<div class="tng-box">
  <div class="tng-box-title">Appendix B — TNG eWallet Statements</div>
  <div style="font-size:7.5pt;color:#2563eb;margin-bottom:8px">
    ${appendices.length} statement${appendices.length !== 1 ? "s" : ""} — original TNG PDFs with claimed rows highlighted are appended after this report.
  </div>
  ${rows}
</div>`;
}

function renderDeclaration(name: string, org: string, generatedAt: string): string {
  return `
<div class="declaration">
  <div class="declaration-title">Declaration by Claimant</div>
  <div class="declaration-body">
    I hereby certify that the expenses claimed in this document were incurred wholly, exclusively and
    necessarily in the course and performance of my official duties. All amounts stated are true and
    accurate to the best of my knowledge, and where receipts are attached they are genuine documents.
    I understand that submitting a false or inaccurate claim may result in disciplinary action.
  </div>
  <div class="sig-block">
    <div class="sig-field">
      <div class="sig-line"></div>
      <div class="sig-label">Signature</div>
    </div>
    <div class="sig-field">
      <div class="sig-line"></div>
      <div class="sig-label">Full Name</div>
      <div class="sig-value">${esc(name)}</div>
    </div>
    <div class="sig-field">
      <div class="sig-line"></div>
      <div class="sig-label">Company</div>
      <div class="sig-value">${esc(org)}</div>
    </div>
    <div class="sig-field">
      <div class="sig-line"></div>
      <div class="sig-label">Date</div>
      <div class="sig-value">${esc(generatedAt)}</div>
    </div>
  </div>
  <div class="footer-note">Generated by myexpensio · System-generated · audit-ready</div>
</div>`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function periodLabel(start: string | null | undefined, end: string | null | undefined): string {
  if (!start && !end) return "—";
  const s = start ? new Date(start).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : null;
  const e = end   ? new Date(end).toLocaleDateString("en-MY",   { day: "2-digit", month: "short", year: "numeric" }) : null;
  if (s && e && s !== e) return `${s} – ${e}`;
  return s ?? e ?? "—";
}

// Re-export type so pipeline can import it without going through types.ts again
export type { TngAppendixPreview };
