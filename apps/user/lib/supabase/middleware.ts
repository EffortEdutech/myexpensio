// apps/user/lib/supabase/middleware.ts

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

function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/')
}

function isForgotPasswordResetPath(request: NextRequest): boolean {
  return (
    request.nextUrl.pathname === '/forgot-password' &&
    request.nextUrl.searchParams.get('step') === 'reset'
  )
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

  if (isApiPath(pathname)) {
    return supabaseResponse
  }

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user) {
    const mustChangePassword = user.app_metadata?.must_change_password === true
    const forgotPasswordResetPath = isForgotPasswordResetPath(request)

    if (mustChangePassword && !isChangePasswordPath(pathname)) {
      return NextResponse.redirect(new URL('/change-password', request.url))
    }

    if (!mustChangePassword && isChangePasswordPath(pathname)) {
      return NextResponse.redirect(new URL('/home', request.url))
    }

    if (!mustChangePassword && isAuthOnlyPath(pathname) && !forgotPasswordResetPath) {
      return NextResponse.redirect(new URL('/home', request.url))
    }

    if (mustChangePassword && isAuthOnlyPath(pathname) && !forgotPasswordResetPath) {
      return NextResponse.redirect(new URL('/change-password', request.url))
    }
  }

  return supabaseResponse
}