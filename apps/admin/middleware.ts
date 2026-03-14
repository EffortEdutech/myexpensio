// apps/admin/middleware.ts
//
// Two jobs:
//   1. Refresh Supabase session cookie on every request
//   2. Protect all routes — only profiles.role = 'ADMIN' may enter
//
// Login page rule:
//   - If user is logged in AND is ADMIN → redirect to /dashboard
//   - If user is logged in but NOT ADMIN → stay on /login (show error)
//   - This prevents the redirect loop where a non-admin user bounces
//     between /login?error=unauthorized and /dashboard indefinitely.

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  let response = NextResponse.next({ request: { headers: request.headers } })

  // Build Supabase client that reads/writes cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Always refresh session
  const { data: { user } } = await supabase.auth.getUser()

  if (isPublic) {
    // On /login: only redirect to /dashboard if user is actually ADMIN.
    // If they are logged in but not ADMIN, leave them on /login so the
    // error message displays — do NOT redirect or the loop starts.
    if (user && pathname === '/login') {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (profile?.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      // Not ADMIN — fall through, stay on /login
    }
    return response
  }

  // Protected routes — must be authenticated
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Must be ADMIN
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
