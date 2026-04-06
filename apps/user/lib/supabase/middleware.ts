// apps/user/lib/supabase/middleware.ts
// Called from apps/user/middleware.ts on every request.
// Responsibilities:
//   1. Refresh the Supabase session
//   2. Redirect unauthenticated users away from protected routes
//   3. Redirect authenticated users away from auth-only routes
//   4. Force first-login password change when must_change_password=true

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/accept-invite',
  '/forgot-password',
  '/auth',
  '/auth-test',
  '/change-password',
]

const AUTH_ONLY_PATHS = ['/login', '/forgot-password']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'),
  )
}

function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(p + '?'))
}

function isChangePasswordPath(pathname: string): boolean {
  return pathname === '/change-password' || pathname.startsWith('/change-password?')
}

function getAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  return key
}

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    const mustChangePassword = user.app_metadata?.must_change_password === true

    if (mustChangePassword && !isChangePasswordPath(pathname)) {
      return NextResponse.redirect(new URL('/change-password', request.url))
    }

    if (!mustChangePassword && isChangePasswordPath(pathname)) {
      return NextResponse.redirect(new URL('/home', request.url))
    }

    if (!mustChangePassword && isAuthOnlyPath(pathname)) {
      return NextResponse.redirect(new URL('/home', request.url))
    }

    if (mustChangePassword && isAuthOnlyPath(pathname)) {
      return NextResponse.redirect(new URL('/change-password', request.url))
    }
  }

  return supabaseResponse
}