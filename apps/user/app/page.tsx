import { redirect } from 'next/navigation'

// Root route — middleware handles auth, this just redirects
export default function RootPage() {
  redirect('/home')
}
