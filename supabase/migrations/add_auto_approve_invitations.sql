-- Migration: add auto_approve_invitations to platform_config
-- Run in Supabase SQL editor before deploying the new code.
--
-- When true: invitation_requests submitted by workspace admins are
--            automatically approved + executed without Console staff review.
-- When false (default): Console staff must manually approve & execute.

ALTER TABLE public.platform_config
  ADD COLUMN IF NOT EXISTS auto_approve_invitations boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.platform_config.auto_approve_invitations IS
  'When true, invitation_requests from workspace admins are auto-executed immediately without Console review.';

-- Update the singleton row if it exists
UPDATE public.platform_config
SET auto_approve_invitations = false
WHERE id = true;
