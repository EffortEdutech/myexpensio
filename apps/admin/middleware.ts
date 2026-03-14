// apps/admin/middleware.ts
//
// Runs on every request to apps/admin.
// Two jobs:
//   1. Refresh the Supabase session cookie (required by @supabase/ssr)
//   2. Protect all routes (except /login and /auth/*) behind an auth + role check
//
// Access is granted if the authenticated user satisfies AT LEAST ONE of:
//   A) profiles.role = 'ADMIN'              → platform superadmin
//   B) org_members.org_role IN ('OWNER','MANAGER')  → org-level admin
//
// The actual org scoping happens inside each page/API route using the
// helper in lib/auth.ts — middleware only decides "can you enter at all".

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths through without session checks
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // ── Build a Supabase client that reads/writes cookies ──────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — always run even on public paths
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Public paths: if already logged in redirect to dashboard ──────────────
  if (isPublic) {
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // ── Protected paths: must be authenticated ─────────────────────────────────
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role check: platform ADMIN or org OWNER/MANAGER ───────────────────────
  // We do a lightweight DB check here. Two queries kept minimal.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isPlatformAdmin = profile?.role === 'ADMIN'

  if (!isPlatformAdmin) {
    // Check org membership role
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_role')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .in('org_role', ['OWNER', 'MANAGER'])
      .limit(1)
      .single()

    if (!membership) {
      // Authenticated but not an admin of anything — show 403 page
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
