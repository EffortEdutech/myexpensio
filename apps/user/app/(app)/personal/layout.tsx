// apps/user/app/(app)/personal/layout.tsx
//
// Personal Space sub-layout.
// Inherits the outer (app)/layout.tsx shell (auth, header, SpaceSwitcher).
// Replaces the Work bottom nav with a Personal-focused nav:
//   Dashboard · Expenses · + Add · Tax Summary

import type { ReactNode } from 'react'
import { PersonalNav } from '@/components/PersonalNav'

export default function PersonalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PersonalNav />
    </>
  )
}
