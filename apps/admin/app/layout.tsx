// apps/admin/app/layout.tsx
//
// Root layout. Minimal — no shell here because /login has a bare layout
// and all protected routes get their shell from (protected)/layout.tsx.

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'myexpensio Admin',
  description: 'myexpensio Internal Admin App',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
