'use client'
// components/SmartNav.tsx
//
// Single bottom-nav slot rendered by (app)/layout.tsx.
// Reads the current pathname and renders the right nav:
//
//   /personal/*  → PersonalNav (indigo, 4 tabs)
//   /business/*  → BusinessNav (green, 5 tabs)
//   everything else → WorkNav (slate, 6 tabs — the default)
//
// This means each space has its own nav without ever mounting two navs
// at the same time. Sub-layouts (personal/layout, business/layout) do
// NOT render their own navs — SmartNav handles it centrally.

import { usePathname } from 'next/navigation'
import { Nav }         from '@/components/Nav'
import { PersonalNav } from '@/components/PersonalNav'
import { BusinessNav } from '@/components/BusinessNav'

export function SmartNav() {
  const pathname = usePathname()

  if (pathname.startsWith('/personal')) return <PersonalNav />
  if (pathname.startsWith('/business')) return <BusinessNav />
  return <Nav />
}
