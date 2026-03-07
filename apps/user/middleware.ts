// apps/user/middleware.ts
// Runs on every matched request BEFORE the page/route handler.
// All logic lives in lib/supabase/middleware.ts for testability.

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - Common static asset extensions
     *
     * The negative lookahead ensures middleware runs on all app routes
     * without triggering on Next.js internals.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
