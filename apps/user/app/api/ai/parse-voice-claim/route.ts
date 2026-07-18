// apps/user/app/api/ai/parse-voice-claim/route.ts
// POST /api/ai/parse-voice-claim
//
// AI Capture Sprint 4 — see docs/03-sprint-plans/ai-capture/01_SPRINT_PLAN_AI_CAPTURE.md
//
// Sends a short voice-note recording to the Gemini API (free tier, server-
// side key) and returns proposed claim-item fields. The user always reviews
// before anything is saved — same rule as every other AI route in this
// project (S1 receipt, S3 odometer). This endpoint only proposes values, it
// never creates a claim item itself.
//
// Response schema is deliberately IDENTICAL to /api/ai/extract-receipt's
// { amount, currency, date, merchant, category_guess, confidence } — not a
// coincidence. Mobile's AddClaimItemModal already has a full "propose ->
// review sheet -> user confirms -> save" pipeline built around
// AiExtractedFields (AiReviewModal.tsx, S1). Reusing the exact same shape
// means voice entry plugs into that existing, already-tested UI instead of
// a second parallel review flow. `merchant` carries voice's spoken
// location/context (e.g. "Grab from KLCC to the office") rather than a
// receipt's printed merchant name — same field, different source.
//
// Auth/gate/error-shape/model pinning: identical pattern to
// /api/ai/extract-receipt and /api/ai/extract-odometer — see those files'
// header comments for the full rationale.

import { type NextRequest, NextResponse } from 'next/server'
import { createClientForRequest } from '@/lib/supabase/api-client'
import { loadTierAndEntitlements } from '@/lib/usage-limits'

export const runtime = 'nodejs'

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`

function err(code: string, message: string, status: number, details?: object) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status })
}

// ── Response schema Gemini must fill in ──────────────────────────────────────
// Same shape as RECEIPT_SCHEMA in extract-receipt/route.ts — see file header.
const VOICE_CLAIM_SCHEMA = {
  type: 'OBJECT',
  properties: {
    amount: {
      type: 'NUMBER',
      description: 'The expense amount mentioned, as a plain number. Null if no amount was spoken.',
      nullable: true,
    },
    currency: {
      type: 'STRING',
      description: 'ISO 4217 currency code. Default to MYR unless another currency is explicitly spoken.',
    },
    date: {
      type: 'STRING',
      description:
        "Transaction date in YYYY-MM-DD format, only if a specific date/relative day (e.g. \"yesterday\", \"last Tuesday\") is spoken. Null if no date is mentioned — do not guess today's date.",
      nullable: true,
    },
    merchant: {
      type: 'STRING',
      description:
        'A short (under 60 characters) summary of the merchant, location, or context spoken — e.g. "Grab from KLCC to office", "Petronas Ayer Keroh", "Client lunch with ABC Sdn Bhd". Null if nothing usable was said.',
      nullable: true,
    },
    category_guess: {
      type: 'STRING',
      description:
        'Best-guess expense category from the spoken content, one of: "Mileage", "Toll", "Parking", "Taxi", "Grab", "Train", "Flight", "Meal", "Lodging", "Per Diem", "Misc". Null if unclear.',
      nullable: true,
    },
    confidence: {
      type: 'STRING',
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      description:
        'HIGH if amount and category are both clearly stated, LOW if the audio is unclear/silent/background-noise-only or the key fields are ambiguous, MEDIUM otherwise.',
    },
  },
  required: ['confidence'],
}

const PROMPT = `You are listening to a short voice note from an employee describing an expense claim for a mileage/expense claim app. The speaker may talk in English, Malay, or a mix of both (common in Malaysia) — understand either. Extract the amount, currency, transaction date (only if a specific day is mentioned), a short merchant/location/context summary, and the best-guess expense category. This is a real expense claim — only report what was actually said, do not invent details. If a field wasn't mentioned or isn't clear, return null for it rather than guessing. Report your confidence honestly: LOW if the audio is unclear, silent, mostly background noise, or the key fields (amount, category) are ambiguous.`

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

  // ── Tier gate — PRO/PREMIUM only for S4 (admins bypass for testing) ──────
  const { tier } = await loadTierAndEntitlements(supabase, membership.org_id, isAdmin)
  if (tier === 'FREE' && !isAdmin) {
    return err(
      'UPGRADE_REQUIRED',
      'AI voice claim entry is a PRO/PREMIUM feature. Upgrade in Settings → Billing to unlock, or enter this claim manually.',
      403,
    )
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  // { audio, mimeType } — mimeType matters more here than for images: Gemini
  // needs the real container format (m4a on iOS/Android, webm on web) to
  // decode the audio correctly.
  const body = await request.json().catch(() => ({})) as { audio?: string; mimeType?: string }
  const { audio, mimeType } = body
  if (!audio) return err('VALIDATION_ERROR', 'audio is required.', 400)

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
  if (!GEMINI_API_KEY) {
    console.error('[POST /api/ai/parse-voice-claim] GEMINI_API_KEY not set')
    return err('SERVER_ERROR', 'AI extraction is not configured.', 500)
  }

  const base64 = audio.includes(',') ? audio.split(',', 2)[1] : audio
  const audioMimeType = mimeType || 'audio/m4a'

  // ── Call Gemini ────────────────────────────────────────────────────────
  try {
    const upstream = await fetch(GEMINI_URL(GEMINI_API_KEY), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: audioMimeType, data: base64 } },
          ],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: VOICE_CLAIM_SCHEMA,
          temperature: 0.1,
        },
      }),
      // Voice notes are short (client caps recording length) but transcription
      // + reasoning can take longer than a single image read — same ceiling
      // as the other two AI routes for consistency, generous enough either way.
      signal: AbortSignal.timeout(20_000),
    })

    const rawText = await upstream.text()

    if (!upstream.ok) {
      console.error('[POST /api/ai/parse-voice-claim] Gemini error:', upstream.status, rawText.slice(0, 300))
      if (upstream.status === 429) {
        return err(
          'UPSTREAM_RATE_LIMITED',
          'AI extraction is busy right now. Please try again in a moment, or enter this claim manually.',
          503,
        )
      }
      if (upstream.status === 400) {
        return err('VALIDATION_ERROR', 'Could not process this recording. Try recording again or enter manually.', 422)
      }
      return err('UPSTREAM_ERROR', 'AI extraction failed. Please enter this claim manually.', 502)
    }

    let upstreamJson: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    try {
      upstreamJson = JSON.parse(rawText)
    } catch {
      console.error('[POST /api/ai/parse-voice-claim] non-JSON Gemini response:', rawText.slice(0, 300))
      return err('UPSTREAM_ERROR', 'AI extraction returned an unexpected response. Please enter this claim manually.', 502)
    }

    const modelText = upstreamJson.candidates?.[0]?.content?.parts?.[0]?.text
    if (!modelText) {
      return err('PARSE_ERROR', 'Could not understand this recording. Please enter manually.', 422)
    }

    let fields: GeminiField
    try {
      fields = JSON.parse(modelText)
    } catch {
      console.error('[POST /api/ai/parse-voice-claim] model returned non-JSON text:', modelText.slice(0, 300))
      return err('PARSE_ERROR', 'Could not understand this recording. Please enter manually.', 422)
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
    console.error('[POST /api/ai/parse-voice-claim] fetch error:', msg)
    if (msg.includes('timed out') || msg.includes('abort') || msg.includes('TimeoutError')) {
      return err('TIMEOUT', 'AI extraction timed out. Please try again or enter this claim manually.', 504)
    }
    return err('SERVER_ERROR', 'Could not reach AI extraction service. Please enter this claim manually.', 502)
  }
}
