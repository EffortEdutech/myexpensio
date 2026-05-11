// apps/user/app/(app)/dev/gps-sim/page.tsx
// DEV-ONLY route -- blocked in production.
import { redirect } from 'next/navigation'

export default function GpsSimPage() {
  if (process.env.NODE_ENV !== 'development') {
    redirect('/home')
  }
  return null
}
