// apps/user/app/api/ai/extract-odometer/route.ts
// POST /api/ai/extract-odometer
//
// AI Capture Sprint 3 — see docs/03-sprint-plans/ai-capture/01_SPRINT_PLAN_AI_CAPTURE.md
//
// Sends an odometer photo to the Gemini API (free tier, server-side key) and
// returns a proposed reading for the trip form to pre-fill. The user always
// confirms before anything is written — final_distance_m is only ever set
// from the confirmed reading, same single-source-of-truth rule as everywhere
// else in this codebase. This does NOT replace scan_service's ODOMETER mode;
// that keeps running as the fallback path (Source Boundary, sprint plan §1).
//
// Auth/gate/error-shape/model pinning: identical pattern to
// /api/ai/extract-receipt/route.ts (S1) — see that file's header comments for
// the full rationale. Duplicated here rather than shared because the two
// routes' schemas/prompts are small and independent; a shared helper can be
// extracted later if a third AI route needs the exact same shape.

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
// Deliberately minimal — a single numeric reading plus confidence. Unlike
// receipts, there's nothing else useful to extract from an odometer photo.
const ODOMETER_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reading_km: {
      type: 'NUMBER',
      description:
        'The odometer reading in kilometers, as shown on the display. If the display shows miles, convert to km (1 mile = 1.60934 km). Null if not legible.',
      nullable: true,
    },
    confidence: {
      type: 'STRING',
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      description:
        'HIGH if every digit is clearly legible, LOW if the photo is blurry/dark/glare/cropped or any digit is ambiguous, MEDIUM otherwise.',
    },
  },
  required: ['confidence'],
}

const PROMPT = `You are reading a photo of a vehicle odometer for a mileage-claim app. The display may be mechanical (physical wheel digits), a plain LCD screen, or a backlit LCD screen (dashboard lit up, photo taken at night or in a dark garage) — handle all three. Extract the distance reading as a number in kilometers. Read every digit carefully, including any decimal/tenths digit if shown. This reading is used to calculate a real reimbursement amount, so accuracy matters more than completeness — if any digit is unclear, glare-obscured, or cut off, return null and report LOW confidence rather than guessing a number.`

type GeminiField = { reading_km: number | null; confidence: 'HIGH' | 'MEDIUM' | 'LOW' }

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

  // ── Tier gate — PRO/PREMIUM only for S3 (admins bypass for testing) ──────
  const { tier } = await loadTierAndEntitlements(supabase, membership.org_id, isAdmin)
  if (tier === 'FREE' && !isAdmin) {
    return err(
      'UPGRADE_REQUIRED',
      'AI odometer reading is a PRO/PREMIUM feature. Upgrade in Settings → Billing to unlock, or enter this reading manually.',
      403,
    )
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  const body = await request.json().catch(() => ({})) as { image?: string }
  const { image } = body
  if (!image) return err('VALIDATION_ERROR', 'image is required.', 400)

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? ''
  if (!GEMINI_API_KEY) {
    console.error('[POST /api/ai/extract-odometer] GEMINI_API_KEY not set')
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
          responseSchema: ODOMETER_SCHEMA,
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    })

    const rawText = await upstream.text()

    if (!upstream.ok) {
      console.error('[POST /api/ai/extract-odometer] Gemini error:', upstream.status, rawText.slice(0, 300))
      if (upstream.status === 429) {
        return err(
          'UPSTREAM_RATE_LIMITED',
          'AI extraction is busy right now. Please try again in a moment, or enter this reading manually.',
          503,
        )
      }
      if (upstream.status === 400) {
        return err('VALIDATION_ERROR', 'Could not read this image. Try a clearer photo or enter manually.', 422)
      }
      return err('UPSTREAM_ERROR', 'AI extraction failed. Please enter this reading manually.', 502)
    }

    let upstreamJson: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
    try {
      upstreamJson = JSON.parse(rawText)
    } catch {
      console.error('[POST /api/ai/extract-odometer] non-JSON Gemini response:', rawText.slice(0, 300))
      return err('UPSTREAM_ERROR', 'AI extraction returned an unexpected response. Please enter this reading manually.', 502)
    }

    const modelText = upstreamJson.candidates?.[0]?.content?.parts?.[0]?.text
    if (!modelText) {
      return err('PARSE_ERROR', 'Could not extract a reading from this photo. Please enter manually.', 422)
    }

    let fields: GeminiField
    try {
      fields = JSON.parse(modelText)
    } catch {
      console.error('[POST /api/ai/extract-odometer] model returned non-JSON text:', modelText.slice(0, 300))
      return err('PARSE_ERROR', 'Could not extract a reading from this photo. Please enter manually.', 422)
    }

    return NextResponse.json({
      reading_km: typeof fields.reading_km === 'number' ? fields.reading_km : null,
      confidence: fields.confidence ?? 'LOW',
    })

  } catch (e: unknown) {
    const msg = (e as Error).message ?? ''
    console.error('[POST /api/ai/extract-odometer] fetch error:', msg)
    if (msg.includes('timed out') || msg.includes('abort') || msg.includes('TimeoutError')) {
      return err('TIMEOUT', 'AI extraction timed out. Please try again or enter this reading manually.', 504)
    }
    return err('SERVER_ERROR', 'Could not reach AI extraction service. Please enter this reading manually.', 502)
  }
}
