'use client'
// apps/cs/components/ConsoleShell.tsx

import { useState, useEffect } from 'react'
import ConsoleNav from '@/components/ConsoleNav'
import type { ConsoleAuthContext } from '@/lib/auth'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

export default function ConsoleShell({
  ctx,
  children,
}: {
  ctx: ConsoleAuthContext
  children: React.ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pendingInvites, setPendingInvites] = useState(0)

  // Fetch pending invitation count for badge
  useEffect(() => {
    fetch('/api/console/invitation-queue?status=PENDING&page_size=1')
      .then((r) => r.json())
      .then((j) => setPendingInvites(j?.total ?? 0))
      .catch(() => {})
  }, [])

  async function handleSignOut() {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
  }

  const sidebar = (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">Expensio</span>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
            Console
          </span>
        </div>
        <div className="mt-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              ctx.role === 'SUPER_ADMIN'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {ctx.role === 'SUPER_ADMIN' ? '⚡ Super Admin' : '🎧 Support'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        <ConsoleNav
          ctx={ctx}
          badges={{ invitations: pendingInvites }}
          onNavigate={() => setOpen(false)}
        />
      </div>

      {/* User footer */}
      <div className="border-t border-gray-100 px-4 py-4">
        <p className="text-xs font-medium text-gray-700 truncate">
          {ctx.displayName ?? ctx.email ?? 'Staff'}
        </p>
        <p className="text-xs text-gray-400 truncate">{ctx.email}</p>
        <button
          onClick={handleSignOut}
          className="mt-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-200 flex-shrink-0">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex flex-col w-60 h-full bg-white border-r border-gray-200">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center h-14 px-4 lg:px-6 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            className="lg:hidden mr-3 p-1.5 rounded text-gray-500 hover:bg-gray-100"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            Internal — EffortEdutech
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
