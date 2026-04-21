type DbClient = any

const ACTIVE_STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE']

export async function syncSubscriptionStatusSnapshot(
  db: DbClient,
  orgId: string | null | undefined
): Promise<void> {
  if (!orgId) return

  try {
    await db
      .from('billing_subscriptions')
      .select('id')
      .eq('org_id', orgId)
      .in('status', ACTIVE_STATUSES)
      .limit(1)
  } catch {
    // Compatibility shim only.
    // Keep silent so build/runtime won't crash while billing schema evolves.
  }
}