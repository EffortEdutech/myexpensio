// apps/user/lib/org.ts
// Server-side org helpers — import only in Server Components,
// Route Handlers, and Server Actions.
//
// Two functions:
//   bootstrapOrg()  — call on every login; idempotent
//   getActiveOrg()  — call on every protected page load

import { createClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────

export type ActiveOrg = {
  org_id:   string
  org_name: string
  org_role: 'OWNER' | 'MANAGER' | 'MEMBER' | string
  tier:     'FREE' | 'PRO' | string
}

// ── bootstrapOrg ──────────────────────────────────────────────────────────
// Called once per session (from the app layout on first render).
// Creates a personal org + OWNER membership + default rate if the user
// has no org yet. Safe to call on every load — idempotent at DB level.

export async function bootstrapOrg(): Promise<ActiveOrg | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Pull display_name from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase.rpc('bootstrap_personal_org', {
    p_user_id:     user.id,
    p_email:       user.email ?? '',
    p_display_name: profile?.display_name ?? null,
  })

  if (error) {
    console.error('[bootstrapOrg] RPC error:', error.message)
    return null
  }

  return data as ActiveOrg
}

// ── getActiveOrg ──────────────────────────────────────────────────────────
// Lightweight read used by page queries — does NOT create anything.
// Returns null if for some reason the user has no org yet.

export async function getActiveOrg(): Promise<ActiveOrg | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase.rpc('get_active_org', {
    p_user_id: user.id,
  })

  if (error || !data) {
    // Fallback: attempt bootstrap (handles edge case on first load)
    return bootstrapOrg()
  }

  return data as ActiveOrg
}
