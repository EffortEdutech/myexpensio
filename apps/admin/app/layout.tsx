// apps/admin/app/layout.tsx
// Root layout — no shell here. /login has a bare layout.
// All protected routes get WorkspaceShell from (protected)/layout.tsx.

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Expensio Workspace',
  description: 'Expensio Workspace — Team & Partner Admin Portal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
