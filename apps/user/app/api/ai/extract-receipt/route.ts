// apps/user/app/api/ai/extract-receipt/route.ts
// POST /api/ai/extract-receipt
//
// AI Capture Sprint 1 — see docs/03-sprint-plans/ai-capture/01_SPRINT_PLAN_AI_CAPTURE.md
//
// Sends a receipt photo to the Gemini API (free tier, server-side key) and
// returns structured fields for the claim form to pre-fill. The user always
// reviews/edits before anything is saved — this endpoint only proposes values,
// it never writes to a claim itself.
//
// Auth: same createClientForRequest() pattern as /api/exports (supports both
// mobile Bearer-token calls and web cookie sessions), so this route is already
// callable from apps/user-mobile-v2 once S2 wires it up — no rework needed.
//
// Gate: PRO/PREMIUM only for now (S0 decision, 2026-07-17). Platform admins
// (SUPER_ADMIN/SUPPORT) bypass the gate for testing, same as other entitlement
// checks in this codebase.
//
// No new npm dependency — calls the Gemini REST endpoint directly with fetch,
// consistent with AGENTS.md's "do not introduce new production dependencies
// without approval." Model is pinned to a named stable release (not a
// "-latest" alias) so behavior doesn't shift under us; override via
// GEMINI_MODEL if Eff wants to bump it later.

import { type NextRequest, NextResponse } from 'next/server'
import { createClientForRequest } from '@/lib/supabase/api-client'
import { loadTierAndEntitlements } from '@/lib/usage-limits'

export const runtime = 'nodejs'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`

function err(code: string, message: string, status: number, details?: object) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status })
}

// ── Response schema Gemini must fill in ──────────────────────────────────────
// Kept intentionally loose (no strict enum on category) since this endpoint is
// called from multiple claim-item modals (Transport, Parking, Taxi, etc.) that
// each already know their own type — category_guess is a hint, not a source
// of truth. amount/currency/date/merchant are the fields S1's UI wiring
// (ScanPreviewModal -> TransportModal) actually consumes.
const RECEIPT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    amount: {
      type: 'NUMBER',
      description: 'The total amount paid, as shown on the receipt. Null if not legible.',
      nullable: true,
    },
    currency: {
      type: 'STRING',
      description: 'ISO 4217 currency code, e.g. MYR, SGD, USD. Default to MYR if the receipt is in Malaysia and no currency is printed.',
    },
    date: {
      type: 'STRING',
      description: 'Transaction date in YYYY-MM-DD format. Null if not legible.',
      nullable: true,
    },
    merchant: {
      type: 'STRING',
      description: 'Merchant / vendor / business name as printed on the receipt. Null if not legible.',
      nullable: true,
    },
    category_guess: {
      type: 'STRING',
      description: 'Best-guess free-text category, e.g. "Parking", "Taxi", "Meal", "Toll", "Grab", "Lodging". Null if unclear.',
      nullable: true,
    },
    confidence: {
      type: 'STRING',
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      description: 'HIGH if amount and date are both clearly legible, LOW if the image is blurry/dark/cropped, MEDIUM otherwise.',
    },
  },
  required: ['confidence'],
}

const PROMPT = `You are reading a photo of a receipt for an expense claim app. Extract the total amount, currency, transaction date, and merchant name. This is a real receipt from an employee's expense claim — read it carefully and only report what is actually printed. If a field is not legible or not present, return null for it rather than guessing. Report your confidence honestly: LOW if the photo is blurry, dark, cropped, or the key fields are ambiguous.`

type GeminiField = { amount: number | null; currency?: string; date: string | null; merchant: string | null; category_guess: string | null; confidence: 'HIGH' | 'MEDIUM' | 'LOW' }

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClientForRequest(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .limit(1)
    .single()

  if (!membership) return err('NOT_MEMBER', 'No active org membership.', 403)

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = ['SUPER_ADMIN', 'SUPPORT'].includes(callerProfile?.role ?? '')

  // ── Tier gate — PRO/PREMIUM only for S1 (admins bypass for testing) ──────
  const { tier } = await loadTierAndEntitlements(supabase, membership.org_id, isAdmin)
  if (tier === 'FREE' && !isAdmin) {
    return err(
      'UPGRADE_REQUIRED',
      'AI receipt scanning is a PRO/PREMIUM feature. Upgrade in Settings → Billing to unlock, or enter this receipt manually.',
      403,
    )
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as { image?: string }
  const { image } = body
  if (!image) return err('VALIDATION_ERROR', 'image is required.', 400)

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
  if (!GEMINI_API_KEY) {
    console.error('[POST /api/ai/extract-receipt] GEMINI_API_KEY not set')
    return err('SERVER_ERROR', 'AI extraction is not configured.', 500)
  }

  const base64 = image.includes(',') ? image.split(',', 2)[1] : image

  // ── Call Gemini ────────────────────────────────────────────────────────
  try {
    const upstream = await fetch(GEMINI_URL(GEMINI_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RECEIPT_SCHEMA,
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    })

    const rawText = await upstream.text()

    if (!upstream.ok) {
      console.error('[POST /api/ai/extract-receipt] Gemini error:', upstream.status, rawText.slice(0, 300))
      if (upstream.status === 429) {
        return err(
          'UPSTREAM_RATE_LIMITED',
          'AI extraction is busy right now. Please try again in a moment, or enter this receipt manually.',
          503,
        )
      }
      if (upstream.status === 400) {
        return err('VALIDATION_ERROR', 'Could not read this image. Try a clearer photo or enter manually.', 422)
      }
      return err('UPSTREAM_ERROR', 'AI extraction failed. Please enter this receipt manually.', 502)
    }

    let upstreamJson: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    try {
      upstreamJson = JSON.parse(rawText)
    } catch {
      console.error('[POST /api/ai/extract-receipt] non-JSON Gemini response:', rawText.slice(0, 300))
      return err('UPSTREAM_ERROR', 'AI extraction returned an unexpected response. Please enter this receipt manually.', 502)
    }

    const modelText = upstreamJson.candidates?.[0]?.content?.parts?.[0]?.text
    if (!modelText) {
      return err('PARSE_ERROR', 'Could not extract fields from this receipt. Please enter manually.', 422)
    }

    let fields: GeminiField
    try {
      fields = JSON.parse(modelText)
    } catch {
      console.error('[POST /api/ai/extract-receipt] model returned non-JSON text:', modelText.slice(0, 300))
      return err('PARSE_ERROR', 'Could not extract fields from this receipt. Please enter manually.', 422)
    }

    return NextResponse.json({
      amount: typeof fields.amount === 'number' ? fields.amount : null,
      currency: fields.currency || 'MYR',
      date: fields.date ?? null,
      merchant: fields.merchant ?? null,
      category_guess: fields.category_guess ?? null,
      confidence: fields.confidence ?? 'LOW',
    })

  } catch (e: unknown) {
    const msg = (e as Error).message ?? ''
    console.error('[POST /api/ai/extract-receipt] fetch error:', msg)
    if (msg.includes('timed out') || msg.includes('abort') || msg.includes('TimeoutError')) {
      return err('TIMEOUT', 'AI extraction timed out. Please try again or enter this receipt manually.', 504)
    }
    return err('SERVER_ERROR', 'Could not reach AI extraction service. Please enter this receipt manually.', 502)
  }
}
