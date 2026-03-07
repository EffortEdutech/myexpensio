'use client'
// apps/user/components/SignOutButton.tsx
// Small client component — needs browser Supabase client for signOut.

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleSignOut} style={S.btn}>
      Sign out
    </button>
  )
}

const S: Record<string, React.CSSProperties> = {
  btn: {
    fontSize:        12,
    fontWeight:      500,
    color:           '#64748b',
    backgroundColor: 'transparent',
    border:          '1px solid #e2e8f0',
    borderRadius:    6,
    padding:         '4px 10px',
    cursor:          'pointer',
    whiteSpace:      'nowrap',
  },
}
