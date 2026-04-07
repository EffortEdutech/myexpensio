// apps/user/app/auth/callback/route.ts

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

function getAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    (() => {
      throw new Error('Missing Supabase anon key')
    })()
  )
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = request.nextUrl.origin

  const token_hash =
    searchParams.get('token_hash') ??
    searchParams.get('token')

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
    },
  )

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (error) {
      console.error('[auth/callback] verifyOtp error:', error.message)
      return NextResponse.redirect(new URL('/login?error=invalid_link', origin))
    }

    if (type === 'invite') {
      const dest = invite_id
        ? `/accept-invite?invite_id=${invite_id}`
        : '/accept-invite'
      return NextResponse.redirect(new URL(dest, origin))
    }

    if (type === 'recovery') {
      return NextResponse.redirect(
        new URL('/forgot-password?step=reset', origin),
      )
    }

    return NextResponse.redirect(new URL(redirectTo, origin))
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession error:', error.message)
      return NextResponse.redirect(new URL('/login?error=invalid_code', origin))
    }

    return NextResponse.redirect(new URL(redirectTo, origin))
  }

  return NextResponse.redirect(new URL('/login', origin))
}