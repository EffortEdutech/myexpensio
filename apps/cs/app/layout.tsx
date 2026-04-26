import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Expensio Console',
  description: 'Expensio Console — Internal Platform Operations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
