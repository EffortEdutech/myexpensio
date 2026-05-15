// apps/user/app/api/subscription/route.ts
//
// GET /api/subscription
// Returns the current user's subscription state.
// Used by client-side gate components (ProGate, PremiumGate, TrialBanner).
//
// Response shape:
//   {
//     tier:            'FREE' | 'PRO' | 'PREMIUM'
//     status:          'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED'
//     is_active:       boolean
//     is_trial:        boolean
//     trial_days_left: number
//     can_exports:     boolean
//     can_business:    boolean
//   }

import { NextResponse } from 'next/server'
import {
  getUserSubscription,
  canAccessExports,
  canAccessBusinessSpace,
} from '@/lib/subscription'

export async function GET() {
  const sub = await getUserSubscription()

  return NextResponse.json({
    tier:            sub.tier,
    status:          sub.status,
    is_active:       sub.is_active,
    is_trial:        sub.is_trial,
    trial_days_left: sub.trial_days_left,
    trial_expires_at: sub.trial_expires_at,
    can_exports:     canAccessExports(sub),
    can_business:    canAccessBusinessSpace(sub),
  })
}
