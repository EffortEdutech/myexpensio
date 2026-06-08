/**
 * useOrgContext — reads the current user's org membership context from the
 * local profiles_cache table (populated by the bootstrap engine).
 *
 * Returns:
 *   orgId          — the user's active organisation ID (null for solo users)
 *   orgRole        — OWNER | ADMIN | MANAGER | EMPLOYEE | SALES | FINANCE | MEMBER
 *   workspaceType  — TEAM | AGENT | INTERNAL | null
 *   effectiveTier  — tier resolved by get_active_org: ORG sub → USER sub fallback
 *
 * Role helpers:
 *   canManageRates — OWNER or ADMIN only
 *   canSubmitClaims — any role
 *   canApproveClaims — OWNER, ADMIN, MANAGER
 */
import { useQuery } from "@tanstack/react-query";

import { getDatabase } from "@/local-db/database";
import { useAuthStore } from "@/state/authStore";
import type { SubscriptionTier } from "@/features/subscription/types";

type OrgContextRow = {
  org_id: string | null;
  org_role: string | null;
  workspace_type: string | null;
  effective_tier: string | null;
};

async function fetchOrgContext(userId: string | undefined): Promise<OrgContextRow | null> {
  if (!userId) return null;
  const db = await getDatabase();
  return db.getFirstAsync<OrgContextRow>(
    `SELECT org_id, org_role, workspace_type, effective_tier
     FROM profiles_cache
     WHERE id = ?
     LIMIT 1;`,
    [userId]
  );
}

const MANAGE_ROLES = new Set(["OWNER", "ADMIN"]);
const APPROVE_ROLES = new Set(["OWNER", "ADMIN", "MANAGER"]);

export function useOrgContext() {
  const userId = useAuthStore((s) => s.session?.userId);

  const query = useQuery({
    queryKey: ["org_context", userId],
    queryFn: () => fetchOrgContext(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const row = query.data;
  const orgRole = row?.org_role ?? null;

  return {
    orgId: row?.org_id ?? null,
    orgRole,
    workspaceType: row?.workspace_type ?? null,
    effectiveTier: (row?.effective_tier ?? "FREE") as SubscriptionTier,
    // Role helpers
    canManageRates: orgRole ? MANAGE_ROLES.has(orgRole) : true, // solo user = no org role → can always manage own rates
    canApproveClaims: orgRole ? APPROVE_ROLES.has(orgRole) : false,
    isLoading: query.isLoading,
  };
}
