-- Free tier matrix correction:
-- FREE users should not be able to export. In entitlement code, NULL means
-- unlimited, so existing NULL platform config values must become 0.

UPDATE public.platform_config
SET
  free_exports_per_month = 0,
  updated_at = NOW()
WHERE free_exports_per_month IS NULL;

