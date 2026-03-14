// apps/admin/lib/supabase/browser.ts
//
// Browser-side Supabase client for admin app.
// Uses anon key only — RLS is enforced, service role is never exposed here.
//
// Usage (client components):
//   import { supabaseBrowser } from '@/lib/supabase/browser'
//   const { data } = await supabaseBrowser.from('profiles').select(...)

'use client'

import { createBrowserClient } from '@supabase/ssr'

export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
