'use client'
// apps/admin/components/WorkspaceShell.tsx
// Shell layout for Expensio Workspace App.
// Shows dynamic sidebar based on workspaceType + accessLevel.
// Replaces AdminShell for the Workspace App context.

import { useState } from 'react'
import WorkspaceNav from '@/components/WorkspaceNav'
import type { WorkspaceAuthContext } from '@/lib/workspace-auth'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

// Workspace type badge labels
const WORKSPACE_BADGE: Record<string, { label: string; className: string }> = {
  TEAM:     { label: 'Team',    className: 'bg-blue-50 text-blue-700' },
  AGENT:    { label: 'Partner', className: 'bg-purple-50 text-purple-700' },
  INTERNAL: { label: 'Staff',   className: 'bg-amber-50 text-amber-700' },
}

function getWorkspaceBadge(ctx: WorkspaceAuthContext) {
  if (ctx.isInternalStaff) return WORKSPACE_BADGE.INTERNAL
  return WORKSPACE_BADGE[ctx.workspaceType ?? 'TEAM'] ?? WORKSPACE_BADGE.TEAM
}

function getOrgLabel(ctx: WorkspaceAuthContext): string {
  if (ctx.isInternalStaff) return 'All Workspaces'
  return ctx.orgName ?? 'Workspace'
}

export default function WorkspaceShell({
  ctx,
  children,
}: {
  ctx: WorkspaceAuthContext
  children: React.ReactNode
}) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const badge = getWorkspaceBadge(ctx)

  async function handleSignOut() {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
  }

  const sidebarContent = (
    <>
      {/* Logo + app name */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">Expensio</span>
          <span className="text-xs font-semibold text-gray-500">Workspace</span>
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="text-xs text-gray-500 truncate">{getOrgLabel(ctx)}</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3">
        <WorkspaceNav ctx={ctx} onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* User footer */}
      <div className="border-t border-gray-100 px-4 py-3">
        <p className="text-xs font-medium text-gray-700 truncate">
          {ctx.displayName ?? ctx.email ?? 'User'}
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
      <aside className="hidden lg:flex lg:flex-col w-56 bg-white border-r border-gray-200 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-56 h-full bg-white border-r border-gray-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center h-13 px-4 lg:px-5 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            className="lg:hidden mr-3 p-1.5 rounded text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          {ctx.isInternalStaff && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full mr-2">
              ⚡ Staff View
            </span>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
