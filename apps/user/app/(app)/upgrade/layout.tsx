import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Choose Your Plan',
  description: 'Upgrade to Pro or Premium — unlock exports, income tracking, and more.',
}

export default function UpgradeLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
