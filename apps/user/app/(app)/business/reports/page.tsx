'use client'
// apps/user/app/(app)/business/reports/page.tsx
//
// Business Space reports hub — year picker shows:
//   1. LHDN Business Tax Estimation Summary
//   2. P&L breakdown (income vs expenses)
//   3. Download PDF button → /api/reports/pl-pdf
//
// Premium only — PremiumGate in business/layout.tsx handles the gate.

import { useEffect, useState } from 'react'

const CURRENT_YEAR = new Date().getFullYear()
const MIN_YEAR = CURRENT_YEAR - 4

type TaxSummary = {
  year:                     number
  total_income:             number
  total_deductible:         number
  estimated_taxable_income: number
  expense_groups:           { group: string; total: number }[]
  income_count:             number
  expense_count:            number
  disclaimer:               string
}

export default function BusinessReportsPage() {
  const [year,    setYear]    = useState(CURRENT_YEAR)
  const prevYear = () => { if (year > MIN_YEAR) setYear(y => y - 1) }
  const nextYear = () => { if (year < CURRENT_YEAR) setYear(y => y + 1) }
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [summary, setSummary] = useState<TaxSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  // Resolve BUSINESS spaceId once
  useEffect(() => {
    fetch('/api/spaces')
      .then(r => r.json())
      .then(d => {
        const biz = (d.spaces ?? []).find((s: { type: string; id: string }) => s.type === 'BUSINESS')
        if (biz) setSpaceId(biz.id)
        else setError('Business space not found.')
      })
      .catch(() => setError('Failed to load spaces.'))
  }, [])

  // Load tax summary when space or year changes
  useEffect(() => {
    if (!spaceId) return
    setLoading(true)
    setError(null)
    setSummary(null)

    fetch(`/api/reports/tax-business?spaceId=${spaceId}&year=${year}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error.message ?? 'Failed to load summary.')
        else setSummary(d)
      })
      .catch(() => setError('Failed to load tax summary.'))
      .finally(() => setLoading(false))
  }, [spaceId, year])

  async function handleDownloadPdf() {
    if (!spaceId) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/reports/pl-pdf?spaceId=${spaceId}&year=${year}`)
      if (!res.ok) { setError('Failed to generate PDF. Please try again.'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `PL_${year}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Failed to download PDF.')
    } finally {
      setDownloading(false)
    }
  }

  const isProfit = (summary?.estimated_taxable_income ?? 0) >= 0

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}>Reports</h1>
          <div style={S.subtitle}>LHDN tax summary & P&L</div>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading || !summary || !spaceId}
          style={{
            ...S.downloadBtn,
            opacity: (downloading || !summary) ? 0.5 : 1,
          }}
        >
          {downloading ? '⏳ Generating…' : '⬇ Download PDF'}
        </button>
      </div>

      {/* Year picker */}
      <div style={S.yearNav}>
        <button onClick={prevYear} disabled={year <= MIN_YEAR} style={S.arrow}>‹</button>
        <span style={S.yearLabel}>Year {year}</span>
        <button onClick={nextYear} disabled={year >= CURRENT_YEAR} style={S.arrow}>›</button>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}

      {loading && <div style={S.loadingBox}>Loading {year} summary…</div>}

      {summary && !loading && (
        <>
          {/* LHDN Tax Estimation Card */}
          <div style={S.sectionCard}>
            <div style={S.sectionTitle}>🧾 LHDN Tax Estimation — {year}</div>

            <div style={S.taxRow}>
              <span style={S.taxLabel}>Total Business Income</span>
              <span style={{ ...S.taxValue, color: '#16a34a' }}>
                RM {summary.total_income.toFixed(2)}
              </span>
            </div>

            <div style={S.taxRow}>
              <span style={S.taxLabel}>Total Deductible Expenses</span>
              <span style={{ ...S.taxValue, color: '#dc2626' }}>
                − RM {summary.total_deductible.toFixed(2)}
              </span>
            </div>

            {summary.expense_groups.map(g => (
              <div key={g.group} style={S.taxSubRow}>
                <span style={S.taxSubLabel}>  {g.group}</span>
                <span style={S.taxSubValue}>RM {g.total.toFixed(2)}</span>
              </div>
            ))}

            <div style={S.divider} />

            <div style={S.taxRow}>
              <span style={{ ...S.taxLabel, fontWeight: 700, color: '#0f172a' }}>
                Estimated Taxable Income
              </span>
              <span style={{ ...S.taxValue, fontSize: 20, color: isProfit ? '#0f172a' : '#dc2626' }}>
                RM {summary.estimated_taxable_income.toFixed(2)}
              </span>
            </div>

            <div style={S.entryCount}>
              Based on {summary.income_count} income + {summary.expense_count} expense entries
            </div>
          </div>

          {/* P&L Summary Card */}
          <div style={S.sectionCard}>
            <div style={S.sectionTitle}>📊 P&L Summary — {year}</div>

            <div style={S.plRow}>
              <div style={S.plCard}>
                <div style={S.plLabel}>Total Income</div>
                <div style={{ ...S.plAmount, color: '#16a34a' }}>
                  RM {summary.total_income.toFixed(2)}
                </div>
              </div>
              <div style={S.plCard}>
                <div style={S.plLabel}>Total Expenses</div>
                <div style={{ ...S.plAmount, color: '#dc2626' }}>
                  RM {(summary.total_income - summary.estimated_taxable_income - summary.total_deductible + summary.total_deductible).toFixed(2)}
                </div>
              </div>
            </div>

            <div style={S.netRow}>
              <span style={S.netLabel}>Net Profit</span>
              <span style={{
                ...S.netAmount,
                color: summary.total_income - summary.total_deductible >= 0 ? '#16a34a' : '#dc2626',
              }}>
                RM {(summary.total_income - summary.total_deductible).toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              style={{ ...S.pdfBtn, opacity: downloading ? 0.5 : 1 }}
            >
              {downloading ? 'Generating PDF…' : '📄 Download Full P&L Report (PDF)'}
            </button>
          </div>

          {/* Disclaimer */}
          <div style={S.disclaimer}>
            ⚠️ {summary.disclaimer}
          </div>
        </>
      )}

      {summary && !loading && summary.income_count === 0 && summary.expense_count === 0 && (
        <div style={S.emptyBox}>
          No entries recorded for {year}. Add income and expenses to generate a report.
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:        { display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 },
  headerRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title:       { fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 },
  subtitle:    { fontSize: 12, color: '#64748b', marginTop: 2 },
  downloadBtn: { height: 40, padding: '0 16px', borderRadius: 10, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  yearNav:     { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 },
  arrow:       { fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0 4px' },
  yearLabel:   { fontSize: 16, fontWeight: 700, color: '#0f172a', minWidth: 80, textAlign: 'center' },
  errorBox:    { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  loadingBox:  { textAlign: 'center', color: '#94a3b8', fontSize: 14, padding: '32px 0' },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 10 },
  sectionTitle:{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 },
  taxRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  taxLabel:    { fontSize: 13, color: '#374151' },
  taxValue:    { fontSize: 16, fontWeight: 700 },
  taxSubRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 12 },
  taxSubLabel: { fontSize: 12, color: '#64748b' },
  taxSubValue: { fontSize: 12, color: '#64748b' },
  divider:     { height: 1, backgroundColor: '#e2e8f0', margin: '4px 0' },
  entryCount:  { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  plRow:       { display: 'flex', gap: 10 },
  plCard:      { flex: 1, backgroundColor: '#f8fafc', borderRadius: 10, padding: '12px 14px' },
  plLabel:     { fontSize: 11, color: '#64748b', marginBottom: 4 },
  plAmount:    { fontSize: 18, fontWeight: 800 },
  netRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, padding: '12px 14px' },
  netLabel:    { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  netAmount:   { fontSize: 22, fontWeight: 900 },
  pdfBtn:      { width: '100%', height: 46, borderRadius: 12, border: 'none', backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  disclaimer:  { backgroundColor: '#fffbeb', borderRadius: 10, padding: '12px 14px', fontSize: 11, color: '#92400e', lineHeight: 1.6 },
  emptyBox:    { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '24px', backgroundColor: '#f8fafc', borderRadius: 12 },
}
