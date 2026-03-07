// apps/user/lib/supabase/middleware.ts
// Called from apps/user/middleware.ts on every request.
// Responsibilities:
//   1. Refresh the Supabase session (mandatory for @supabase/ssr)
//   2. Redirect unauthenticated users away from protected routes
//   3. Redirect authenticated users away from auth-only routes (login, etc.)

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Routes that do NOT require authentication
const PUBLIC_PATHS = [
  '/login',
  '/accept-invite',
  '/forgot-password',
  '/auth',        // covers /auth/callback
  '/auth-test',   // dev utility page — remove in production
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  )
}

// Auth-only paths: if user IS authenticated, redirect them away
const AUTH_ONLY_PATHS = ['/login', '/forgot-password']

function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '?'))
}

function getAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return key
}

export async function updateSession(request: NextRequest) {
  // Start with a passthrough response; the cookie setAll below
  // will swap this out so new session cookies are forwarded.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Step 1: write to the request object (for downstream middleware)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Step 2: create a fresh response with the updated request
          supabaseResponse = NextResponse.next({ request })
          // Step 3: write to the response so the browser receives the cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() triggers a session refresh if the access token
  // is expired.  Do NOT use getSession() here — it doesn't validate the JWT.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // ── Guard: unauthenticated user on a protected route ──────────────────────
  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Guard: authenticated user on a login/forgot-password page ────────────
  if (user && isAuthOnlyPath(pathname)) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // Pass through — supabaseResponse carries any refreshed session cookies
  return supabaseResponse
}
