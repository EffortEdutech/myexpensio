// apps/user/app/auth/callback/route.ts
// Supabase redirects here after:
//   • Invite link click          → token_hash + type=invite  + invite_id
//   • Magic link / email confirm → token_hash + type=email|magiclink
//   • Password reset             → token_hash + type=recovery
//   • OAuth / PKCE               → code
//
// On success each branch sets the session via cookies and redirects.
// On failure the user is sent to /login with an error query param.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

function getAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    (() => { throw new Error('Missing Supabase anon key') })()
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Use request.nextUrl.origin so it works across dev/staging/prod
  const origin = request.nextUrl.origin

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'invite'
    | 'recovery'
    | 'email'
    | 'magiclink'
    | null
  const code = searchParams.get('code')
  const invite_id = searchParams.get('invite_id')
  const redirectTo = searchParams.get('redirectTo') ?? '/home'

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  // ── Branch A: token_hash (invite / magic link / recovery) ─────────────────
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })

    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message)
      return NextResponse.redirect(
        new URL('/login?error=invalid_link', origin)
      )
    }

    // Invite accepted → go to accept-invite page to provision org membership
    if (type === 'invite') {
      const dest = invite_id
        ? `/accept-invite?invite_id=${invite_id}`
        : '/accept-invite'
      return NextResponse.redirect(new URL(dest, origin))
    }

    // Password reset → go to forgot-password page in reset step
    if (type === 'recovery') {
      return NextResponse.redirect(
        new URL('/forgot-password?step=reset', origin)
      )
    }

    // Email confirmation / magic link → go to app
    return NextResponse.redirect(new URL(redirectTo, origin))
  }

  // ── Branch B: PKCE code exchange (OAuth or email confirm) ─────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(
        new URL('/login?error=invalid_code', origin)
      )
    }

    return NextResponse.redirect(new URL(redirectTo, origin))
  }

  // ── Fallback: nothing to process ──────────────────────────────────────────
  return NextResponse.redirect(new URL('/login', origin))
}
