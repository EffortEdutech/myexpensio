'use client'
// apps/cs/components/ConsoleNav.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ConsoleAuthContext } from '@/lib/auth'

type NavItem = {
  label: string
  href: string
  icon: string
  exact?: boolean
  superAdminOnly?: boolean
  badgeKey?: string
}

type NavGroup = { section: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    section: 'Operations',
    items: [
      {
        label: 'Dashboard',
        href:  '/dashboard',
        exact: true,
        icon:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
    ],
  },
  {
    section: 'Platform',
    items: [
      {
        // Members & Onboarding — the primary Console user-management tool
        // Combines: Add User to Organisation + Invitation Queue
        label:    'Members & Onboarding',
        href:     '/members-onboarding',
        badgeKey: 'invitations',
        icon:     'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      },
      {
        label: 'Workspaces',
        href:  '/workspaces',
        icon:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      {
        label: 'Users',
        href:  '/users',
        icon:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
      {
        label: 'Subscriptions',
        href:  '/subscriptions',
        icon:  'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      },
    ],
  },
  {
    section: 'System',
    items: [
      {
        label: 'Audit Logs',
        href:  '/audit',
        icon:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      },
      {
        label:          'System Config',
        href:           '/system',
        superAdminOnly: true,
        icon:           'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      },
    ],
  },
]

type Badges = { invitations?: number }

export default function ConsoleNav({
  ctx,
  badges = {},
  onNavigate,
}: {
  ctx: ConsoleAuthContext
  badges?: Badges
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className="px-3 space-y-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.section}>
          <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            {group.section}
          </p>
          <div className="space-y-0.5">
            {group.items
              .filter((item) => !item.superAdminOnly || ctx.role === 'SUPER_ADMIN')
              .map((item) => {
                const active =
                  item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/')
                const badge = item.badgeKey
                  ? badges[item.badgeKey as keyof Badges]
                  : undefined

                return (
                  <Link
                    key={item.href}
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
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <span className="flex-1">{item.label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
          </div>
        </div>
      ))}
    </nav>
  )
}
