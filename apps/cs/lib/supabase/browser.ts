// apps/console/lib/supabase/browser.ts
// Browser-side Supabase client — used in client components for auth (sign out etc.)

import { createBrowserClient } from '@supabase/ssr'

export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
