// apps/user/lib/supabase/api-client.ts
//
// createClientForRequest(request)
//
// Creates a Supabase client that supports BOTH authentication methods:
//   1. Bearer token  — mobile app sends Authorization: Bearer <jwt>
//   2. Cookie-based  — web app (standard Next.js SSR session)
//
// Use this in ALL API route handlers that need to accept mobile requests.
// Drop-in replacement for `await createClient()`.

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

function getAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ''
  )
}

/**
 * Returns an authenticated Supabase client from either:
 *   - `Authorization: Bearer <jwt>` header  (mobile app)
 *   - Session cookies                        (web app)
 *
 * Usage in route handlers:
 *   const supabase = await createClientForRequest(request)
 *   const { data: { user } } = await supabase.auth.getUser()
 */
export async function createClientForRequest(
  request: NextRequest
): Promise<SupabaseClient> {
  const authHeader = request.headers.get('Authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7)
    // Standard JS client with JWT in global headers.
    // getUser() sends Authorization: Bearer to Supabase auth API — works correctly.
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      getAnonKey(),
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth:   { persistSession: false, autoRefreshToken: false },
      }
    )
  }

  // Fall back to cookie-based SSR client (web browser)
  return createServerClient() as unknown as SupabaseClient
}
