// apps/user/app/(app)/personal/layout.tsx
//
// Personal Space sub-layout.
// Inherits the outer (app)/layout.tsx shell (auth, header, SpaceSwitcher).
// The PersonalNav bottom tab bar is rendered by SmartNav in the app layout —
// no nav is mounted here to prevent duplicate navs.

import type { ReactNode } from 'react'

export default function PersonalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
