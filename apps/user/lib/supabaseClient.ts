// apps/user/lib/supabaseClient.ts
// ---------------------------------------------------------------------------
// DEPRECATED — do not use this file for new code.
// Use lib/supabase/client.ts  (Client Components)
// Use lib/supabase/server.ts  (Server Components / Route Handlers)
// ---------------------------------------------------------------------------
// Kept only so the /auth-test dev utility page keeps working without changes.

import { createClient } from './supabase/client'

export const supabase = createClient()
