import { NextResponse } from 'next/server'

export async function GET() {
  // Placeholder. Later: exchange auth code for session if using PKCE/server helpers.
  return NextResponse.redirect(new URL('/home', 'http://localhost:3100'))
}