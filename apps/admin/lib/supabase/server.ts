// apps/admin/lib/supabase/server.ts
//
// Two Supabase clients for server-side use:
//
//   createAdminClient()        → anon key + cookie session (respects RLS)
//                                Use for: reading user-scoped data, auth checks
//
//   createServiceRoleClient()  → service role key (bypasses RLS)
//                                Use for: cross-org admin queries, seeding, stats
//                                !! NEVER call from browser — server-side only !!

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ── Session-aware client (respects RLS) ───────────────────────────────────────
export async function createAdminClient() {
  const cookieStore = await cookies()

  type CookieToSet = {
    name: string
    value: string
    options?: CookieOptions
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component — read-only, ignore
          }
        },
      },
    }
  )
}

// ── Service role client (bypasses RLS) ────────────────────────────────────────
// Only use in Route Handlers and Server Actions — never import in client components
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      '[admin] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    )
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
