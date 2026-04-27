'use client'
// apps/admin/components/WorkspaceNav.tsx
//
// Dynamic sidebar navigation for Expensio Workspace App.
// Items shown depend on workspace_type from the auth context.
// workspaceType will always be non-null after the workspace-auth.ts fix
// (defaults to TEAM), but we guard anyway.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { WorkspaceAuthContext } from '@/lib/workspace-auth'

type NavItem = {
  label: string
  href:  string
  icon:  string
  exact?: boolean
}

// ── Nav item sets ──────────────────────────────────────────────────────────────

const TEAM_ITEMS: NavItem[] = [
  {
    label: 'Claims',
    href:  '/claims',
    icon:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    label: 'Rates',
    href:  '/rates',
    icon:  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    label: 'Export Templates',
    href:  '/templates',
    icon:  'M4 6h16M4 10h16M4 14h16M4 18h7',
  },
  {
    label: 'Exports',
    href:  '/exports',
    icon:  'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
  },
  {
    label: 'Audit Log',
    href:  '/audit',
    icon:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
]

const AGENT_ITEMS: NavItem[] = [
  {
    label: 'Referrals',
    href:  '/referrals',
    icon:  'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
  {
    label: 'Commission',
    href:  '/commission',
    icon:  'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  },
]

// Items shown at the bottom of every workspace type
const SHARED_ITEMS: NavItem[] = [
  {
    label: 'Members',
    href:  '/workspace-members',
    icon:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    label: 'Invitations',
    href:  '/invitations',
    icon:  'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    label: 'Billing',
    href:  '/billing',
    icon:  'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    label: 'Settings',
    href:  '/settings',
    icon:  'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

const DASHBOARD_ITEM: NavItem = {
  label: 'Dashboard',
  href:  '/dashboard',
  exact: true,
  icon:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
}

// ── Nav builder ────────────────────────────────────────────────────────────────

function buildNavItems(ctx: WorkspaceAuthContext): NavItem[] {
  // Internal staff who land on Workspace App see everything
  // (but they should primarily use Console for platform operations)
  if (ctx.isInternalStaff) {
    return [
      DASHBOARD_ITEM,
      ...TEAM_ITEMS,
      ...AGENT_ITEMS,
      ...SHARED_ITEMS,
    ]
  }

  // AGENT workspace
  if (ctx.isAgentWorkspace) {
    return [
      DASHBOARD_ITEM,
      ...AGENT_ITEMS,
      ...SHARED_ITEMS,
    ]
  }

  // TEAM workspace — and also the null/unknown fallback (defaults to TEAM)
  // After the workspace-auth.ts fix, workspaceType will never be null,
  // but we keep this as the final fallback for safety.
  return [
    DASHBOARD_ITEM,
    ...TEAM_ITEMS,
    ...SHARED_ITEMS,
  ]
}

// ── Nav link ───────────────────────────────────────────────────────────────────

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <svg
        className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>
      {item.label}
    </Link>
  )
}

// ── WorkspaceNav ───────────────────────────────────────────────────────────────

export default function WorkspaceNav({
  ctx,
  onNavigate,
}: {
  ctx: WorkspaceAuthContext
  onNavigate?: () => void
}) {
  const items = buildNavItems(ctx)

  return (
    <nav className="px-3 space-y-0.5">
      {items.map((item) => (
        <NavLink key={item.href} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  )
}
