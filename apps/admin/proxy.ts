// apps/admin/proxy.ts
//
// Expensio Workspace middleware.
//
// Two jobs:
//   1. Refresh Supabase session cookie on every request
//   2. Ensure only authenticated users with workspace access can enter
//
// WHO CAN ENTER:
//   SUPER_ADMIN / SUPPORT  → internal staff, always allowed
//   USER with workspace management role (OWNER/ADMIN/MANAGER/SALES/FINANCE) → allowed
//   USER with only EMPLOYEE role → redirected to user app (MyExpensio)
//   Not logged in → redirected to /login
//
// NOTE: The lightweight check here only verifies session + profiles.role.
// The detailed workspace-level role check (which org, which role) happens in
// requireWorkspaceAuth() inside each protected layout/route handler.

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth']

// Roles that can access Workspace App directly (internal staff)
const INTERNAL_ROLES = ['SUPER_ADMIN', 'SUPPORT'] as const

// Workspace org_roles that are allowed into this app
const WORKSPACE_MANAGEMENT_ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'FINANCE'] as const

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

  // ── Public paths ────────────────────────────────────────────────────────────

  if (isPublic) {
    if (user && pathname === '/login') {
      // Already logged in → check if they should be redirected to dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role && INTERNAL_ROLES.includes(profile.role as typeof INTERNAL_ROLES[number])) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }

      // For USER role: check if they have any workspace management membership
      if (profile?.role === 'USER') {
        const { data: membership } = await supabase
          .from('org_members')
          .select('org_role')
          .eq('user_id', user.id)
          .eq('status', 'ACTIVE')
          .in('org_role', [...WORKSPACE_MANAGEMENT_ROLES])
          .limit(1)
          .maybeSingle()

        if (membership) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    }
    return response
  }

  // ── Protected paths ─────────────────────────────────────────────────────────

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Get user's platform role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const platformRole = profile?.role

  // ── SUPER_ADMIN / SUPPORT: always allowed ───────────────────────────────────

  if (platformRole && INTERNAL_ROLES.includes(platformRole as typeof INTERNAL_ROLES[number])) {
    return response
  }

  // ── USER: check for workspace management membership ─────────────────────────

  if (platformRole === 'USER') {
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_role')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .in('org_role', [...WORKSPACE_MANAGEMENT_ROLES])
      .limit(1)
      .maybeSingle()

    if (membership) {
      // Has at least one workspace management role → allow through
      // requireWorkspaceAuth in the layout will do the fine-grained check
      return response
    }

    // USER with no workspace management role (pure EMPLOYEE / subscriber)
    // → redirect to MyExpensio (the user app)
    const userAppUrl = process.env.NEXT_PUBLIC_USER_APP_URL ?? 'http://localhost:3100'
    return NextResponse.redirect(new URL(userAppUrl))
  }

  // Any other profile state → send to login
  return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
