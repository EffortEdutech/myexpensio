// apps/user/app/auth-test/page.tsx
// DEV-ONLY route — blocked in production.
import { redirect } from 'next/navigation'

export default function AuthTestPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/')
  }
  return null
}
