// apps/user/lib/supabase/client.ts
// Browser-side Supabase client — safe to import in Client Components.
// Uses @supabase/ssr so cookies are handled correctly for App Router.

import { createBrowserClient } from '@supabase/ssr'

// Support both the legacy PUBLISHABLE_KEY name and the standard ANON_KEY name.
function getAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY)')
  return key
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getAnonKey()
  )
}
