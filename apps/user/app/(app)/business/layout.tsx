// apps/user/app/(app)/business/layout.tsx
//
// Business Space sub-layout.
// Inherits the outer (app)/layout.tsx shell (auth, header, SpaceSwitcher).
// Wraps all /business/* pages in PremiumGate — free users see the upgrade prompt.
// The BusinessNav bottom tab bar is rendered by SmartNav in the app layout —
// no nav is mounted here to prevent duplicate navs.

import type { ReactNode } from 'react'
import { PremiumGate } from '@/components/PremiumGate'

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return (
    <PremiumGate feature="Business Space">
      {children}
    </PremiumGate>
  )
}
