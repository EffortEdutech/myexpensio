'use client'
// apps/admin/components/AdminShell.tsx

import { useState } from 'react'
import AdminNav from '@/components/AdminNav'
import type { AdminAuthContext } from '@/lib/auth'
import { supabaseBrowser } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'

export default function AdminShell({ ctx, children }: { ctx: AdminAuthContext; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="px-6 py-5 border-b border-gray-100">
          <span className="text-base font-bold text-gray-900">myexpensio</span>
          <span className="ml-2 text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4"><AdminNav /></div>
        <div className="border-t border-gray-100 px-4 py-4">
          <p className="text-xs text-gray-700 font-medium truncate">{ctx.displayName ?? ctx.email ?? 'Admin'}</p>
          <p className="text-xs text-gray-400 truncate mb-2">{ctx.email}</p>
          <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative flex flex-col w-60 h-full bg-white border-r border-gray-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <span className="text-base font-bold text-gray-900">myexpensio</span>
              <span className="ml-2 text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Admin</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <AdminNav onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex items-center h-14 px-4 lg:px-6 bg-white border-b border-gray-200 flex-shrink-0">
          <button className="lg:hidden mr-3 p-1.5 rounded text-gray-500 hover:bg-gray-100" onClick={() => setOpen(true)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">Platform Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
