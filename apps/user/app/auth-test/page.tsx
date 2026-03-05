'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AuthTestPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('Ready')
  const [userEmail, setUserEmail] = useState<string | null>(null)

  async function refresh() {
    const { data } = await supabase.auth.getSession()
    setUserEmail(data.session?.user?.email ?? null)
  }

  useEffect(() => {
    refresh()
    const { data } = supabase.auth.onAuthStateChange(() => refresh())
    return () => data.subscription.unsubscribe()
  }, [])

  async function signUp() {
    setStatus('Signing up...')
    const { error } = await supabase.auth.signUp({ email, password })
    setStatus(error ? 'Error: ' + error.message : 'Sign-up requested. If confirmation is on, check Mailpit: http://127.0.0.1:54324')
    refresh()
  }

  async function signIn() {
    setStatus('Signing in...')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setStatus(error ? 'Error: ' + error.message : 'Signed in')
    refresh()
  }

  async function signOut() {
    await supabase.auth.signOut()
    setStatus('Signed out')
    refresh()
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700 }}>Auth Test (User App)</h1>
      <p><b>Signed in as:</b> {userEmail ?? '(not signed in)'}</p>
      <p><b>Status:</b> {status}</p>

      <div style={{ marginTop: 16, display: 'grid', gap: 8, maxWidth: 420 }}>
        <input placeholder='email' value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }} />
        <input placeholder='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={signUp} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}>Sign up</button>
          <button onClick={signIn} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}>Sign in</button>
          <button onClick={signOut} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}>Sign out</button>
        </div>
      </div>

      <p style={{ marginTop: 18 }}>
        Local email inbox (Mailpit): <a href='http://127.0.0.1:54324' target='_blank'>http://127.0.0.1:54324</a>
      </p>
    </div>
  )
}
