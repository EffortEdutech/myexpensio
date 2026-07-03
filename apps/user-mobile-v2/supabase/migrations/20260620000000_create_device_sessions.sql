-- ── device_sessions ──────────────────────────────────────────────────────────
-- Tracks which device each user is currently active on.
-- Used for the "warn + auto-kick" session guard on login.
--
-- Apply via Supabase Dashboard SQL editor or:
--   supabase db push  (if using local CLI workflow)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.device_sessions (
  id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id         TEXT        NOT NULL,
  device_label      TEXT        NOT NULL DEFAULT 'Unknown Device',
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, device_id)
);

-- Fast lookup by user, sorted by recency
CREATE INDEX IF NOT EXISTS device_sessions_user_id_idx
  ON public.device_sessions (user_id);

CREATE INDEX IF NOT EXISTS device_sessions_heartbeat_idx
  ON public.device_sessions (user_id, last_heartbeat_at DESC);

-- RLS: users can only touch their own rows
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_sessions_select"
  ON public.device_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "device_sessions_insert"
  ON public.device_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "device_sessions_update"
  ON public.device_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "device_sessions_delete"
  ON public.device_sessions FOR DELETE
  USING (auth.uid() = user_id);
