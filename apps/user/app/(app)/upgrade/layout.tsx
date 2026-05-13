import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Upgrade to Premium',
  description: 'Unlock Business Space — tax-ready i/o tracker for solo business',
}

export default function UpgradeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
