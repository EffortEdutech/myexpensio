// apps/console/proxy.ts
//
// Console App middleware:
//   1. Refresh Supabase session cookie on every request
//   2. Protect all routes — SUPER_ADMIN and SUPPORT only
//
// Login page rule:
//   - Logged in + authorised  → redirect to /dashboard
//   - Logged in + not allowed → stay on /login (show error)

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

  type CookieToSet = { name: string; value: string; options?: CookieOptions }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isPublic) {
    if (user && pathname === '/login') {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      if (isAllowedRole(profile?.role)) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return response
  }

  if (!user) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

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
