// apps/admin/proxy.ts
//
// Two jobs:
//   1. Refresh Supabase session cookie on every request
//   2. Protect all routes — only profiles.role IN ('SUPER_ADMIN','SUPPORT') may enter
//
// Login page rule:
//   - If user is logged in AND is SUPER_ADMIN/SUPPORT → redirect to /dashboard
//   - If user is logged in but NOT authorised → stay on /login (show error)
//   - This prevents the redirect loop where a non-admin user bounces
//     between /login?error=unauthorized and /dashboard indefinitely.

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth']

const ALLOWED_ROLES = ['SUPER_ADMIN', 'SUPPORT'] as const
type AllowedRole = typeof ALLOWED_ROLES[number]

function isAllowedRole(role: string | null | undefined): role is AllowedRole {
  return ALLOWED_ROLES.includes(role as AllowedRole)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  let response = NextResponse.next({ request: { headers: request.headers } })

  type CookieToSet = {
    name: string
    value: string
    options?: CookieOptions
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isPublic) {
    if (user && pathname === '/login') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (isAllowedRole(profile?.role)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return response
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!isAllowedRole(profile?.role)) {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
