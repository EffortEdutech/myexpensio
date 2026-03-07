// apps/user/lib/supabase/server.ts
// Server-side Supabase client — import in Server Components, Route Handlers,
// and Server Actions.  Uses async cookies() (Next.js 15+).

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY)')
  return key
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — the middleware
            // handles session refresh so this is safe to swallow.
          }
        },
      },
    }
  )
}
