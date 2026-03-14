// apps/admin/components/AdminShell.tsx
//
// Main layout shell for the admin app.
// Renders: left sidebar (nav) + top header + main content area.

'use client'

import { useState } from 'react'
import AdminNav from '@/components/AdminNav'
import type { AdminAuthContext } from '@/lib/auth'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

type Props = {
  ctx: AdminAuthContext
  children: React.ReactNode
}

export default function AdminShell({ ctx, children }: Props) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
  }

  const roleLabel = ctx.isPlatformAdmin
    ? 'Superadmin'
    : ctx.orgRole === 'OWNER'
    ? 'Owner'
    : 'Manager'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar (desktop) ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-200 flex-shrink-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-base font-bold text-gray-900">myexpensio</span>
          <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
            Admin
          </span>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4">
          <AdminNav />
        </div>

        {/* Footer: user info + sign out */}
        <div className="border-t border-gray-100 px-4 py-4">
          <div className="text-xs text-gray-500 truncate mb-2">{ctx.orgId ? `Org: ${ctx.orgId.slice(0, 8)}…` : 'All orgs'}</div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">{roleLabel}</span>
            <button
              onClick={handleSignOut}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ─────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Panel */}
          <aside className="relative flex flex-col w-60 h-full bg-white border-r border-gray-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <span className="text-base font-bold text-gray-900">myexpensio</span>
              <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                Admin
              </span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <AdminNav onNavigate={() => setSidebarOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center h-14 px-4 lg:px-6 bg-white border-b border-gray-200 flex-shrink-0">
          {/* Mobile menu button */}
          <button
            className="lg:hidden mr-3 p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb placeholder — each page can override via a portal or context */}
          <div className="flex-1" />

          {/* Role badge */}
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {roleLabel}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
