/**
 * Pull engine — fetches server changes since last cursor and applies them
 * to the local database.
 *
 * Currently applies: profile, subscription, spaces, claims, claim_items,
 * trips, tng_transactions, export_jobs.
 *
 * Each entity type routes to its own local repository upsert function.
 */
import { getDatabase } from "@/local-db/database";
import {
  getSyncState,
  upsertSyncState,
} from "@/local-db/repositories/syncStateRepository";
import type { PullSyncChange, PullSyncResponse } from "@/sync/syncApi";
import { SYNC_PULL_SCOPE } from "@/sync/syncConfig";
import { nowIso } from "@/utils/time";

export type PullResult = {
  applied: number;
  cursor: string | null;
  error?: string;
};

type PullFn = (cursor: string | null) => Promise<PullSyncResponse>;

export async function pullAndApplyChanges(pull: PullFn): Promise<PullResult> {
  const syncState = await getSyncState(SYNC_PULL_SCOPE);
  const cursor = syncState?.cursor ?? null;

  let response: PullSyncResponse;
  try {
    response = await pull(cursor);
  } catch (err) {
    return {
      applied: 0,
      cursor,
      error: err instanceof Error ? err.message : "Pull failed",
    };
  }

  // Defensive: response.changes should always be an array per PullSyncResponse,
  // but a malformed/non-JSON response (e.g. an unexpected redirect returning
  // HTML) must never crash the app — degrade to "nothing to apply" instead.
  const changes = Array.isArray(response.changes) ? response.changes : [];

  if (changes.length === 0) {
    await upsertSyncState(SYNC_PULL_SCOPE, response.cursor, nowIso());
    return { applied: 0, cursor: response.cursor };
  }

  const db = await getDatabase();
  let applied = 0;

  for (const change of changes) {
    try {
      await applyChange(db, change);
      applied++;
    } catch {
      // Non-fatal: log and continue
    }
  }

  await upsertSyncState(SYNC_PULL_SCOPE, response.cursor, nowIso());
  return { applied, cursor: response.cursor };
}

type BindRow = (string | number | null)[];

async function applyChange(
  db: Awaited<ReturnType<typeof getDatabase>>,
  change: PullSyncChange
): Promise<void> {
  const p = change.payload as Record<string, unknown>;
  const now = nowIso();

  if (change.operation === "delete") {
    await softDeleteEntity(db, change.entity_type, change.entity_id, now);
    return;
  }

  switch (change.entity_type) {
    case "claim":
      await db.runAsync(
        `INSERT INTO claims (id, space_id, title, status, period_start, period_end,
           total_amount_cents, currency, submitted_at, sync_status, created_at, updated_at,
           deleted_at, device_id)
         VALUES (?,?,?,?,?,?,?,?,?,'synced',?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, status=excluded.status,
           period_start=excluded.period_start, period_end=excluded.period_end,
           total_amount_cents=excluded.total_amount_cents,
           submitted_at=excluded.submitted_at, sync_status='synced',
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
        [
          p.id, p.space_id ?? null, p.title ?? null, p.status ?? "draft",
          p.period_start ?? null, p.period_end ?? null,
          p.total_amount_cents ?? 0, p.currency ?? "MYR",
          p.submitted_at ?? null, p.created_at ?? now, p.updated_at ?? now,
          p.deleted_at ?? null, p.device_id ?? "server",
        ] as BindRow
      );
      break;

    case "claim_item":
      await db.runAsync(
        `INSERT INTO claim_items (id, claim_id, type, mode, title, amount_cents, currency,
           item_date, notes, receipt_id, trip_id, tng_transaction_id,
           sync_status, created_at, updated_at, deleted_at, device_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'synced',?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           type=excluded.type, title=excluded.title, amount_cents=excluded.amount_cents,
           item_date=excluded.item_date, notes=excluded.notes,
           receipt_id=excluded.receipt_id, trip_id=excluded.trip_id,
           tng_transaction_id=excluded.tng_transaction_id,
           sync_status='synced', updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
        [
          p.id, p.claim_id, p.type, p.mode ?? null, p.title ?? "",
          p.amount_cents ?? 0, p.currency ?? "MYR", p.item_date ?? now,
          p.notes ?? null, p.receipt_id ?? null, p.trip_id ?? null,
          p.tng_transaction_id ?? null, p.created_at ?? now,
          p.updated_at ?? now, p.deleted_at ?? null, p.device_id ?? "server",
        ] as BindRow
      );
      break;

    case "trip":
      await db.runAsync(
        `INSERT INTO trips (id, claim_id, status, started_at, stopped_at,
           final_distance_m, distance_source, vehicle_type,
           sync_status, created_at, updated_at, deleted_at, device_id)
         VALUES (?,?,?,?,?,?,?,?,'synced',?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           status=excluded.status, stopped_at=excluded.stopped_at,
           final_distance_m=excluded.final_distance_m,
           distance_source=excluded.distance_source,
           sync_status='synced', updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
        [
          p.id, p.claim_id ?? null, p.status ?? "draft",
          p.started_at ?? now, p.stopped_at ?? null,
          p.final_distance_m ?? null, p.distance_source ?? null,
          p.vehicle_type ?? null, p.created_at ?? now,
          p.updated_at ?? now, p.deleted_at ?? null, p.device_id ?? "server",
        ] as BindRow
      );
      break;

    case "receipt":
      await db.runAsync(
        `INSERT INTO receipts (id, owner_entity_type, owner_entity_id, local_uri,
           remote_path, mime_type, file_size, upload_status,
           sync_status, created_at, updated_at, deleted_at, device_id)
         VALUES (?,?,?,?,?,?,?,'uploaded','synced',?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           remote_path=excluded.remote_path, upload_status='uploaded',
           sync_status='synced', updated_at=excluded.updated_at`,
        [
          p.id, p.owner_entity_type, p.owner_entity_id,
          p.local_uri ?? "", p.remote_path ?? null,
          p.mime_type ?? null, p.file_size ?? null,
          p.created_at ?? now, p.updated_at ?? now,
          p.deleted_at ?? null, p.device_id ?? "server",
        ] as BindRow
      );
      break;

    case "ledger_entry":
      await db.runAsync(
        `INSERT INTO ledger_entries (id, space_type, entry_type, amount_cents, currency,
           entry_date, category, description, is_tax_deductible, tax_category,
           payment_method, income_source, receipt_path,
           sync_status, created_at, updated_at, deleted_at, device_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'synced',?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           amount_cents=excluded.amount_cents, category=excluded.category,
           description=excluded.description, sync_status='synced',
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
        [
          p.id, p.space_type ?? "PERSONAL", p.entry_type ?? "EXPENSE",
          p.amount_cents ?? 0, p.currency ?? "MYR",
          p.entry_date ?? now, p.category ?? "Others",
          p.description ?? null, p.is_tax_deductible ? 1 : 0,
          p.tax_category ?? null, p.payment_method ?? null,
          p.income_source ?? null, p.receipt_path ?? null,
          p.created_at ?? now, p.updated_at ?? now,
          p.deleted_at ?? null, p.device_id ?? "server",
        ] as BindRow
      );
      break;

    case "tng_transaction":
      await db.runAsync(
        `INSERT INTO tng_transactions (id, statement_id, trans_no, sector,
           amount_cents, currency, transaction_date, entry_location, exit_location,
           claimed, claim_item_id, link_status,
           sync_status, created_at, updated_at, deleted_at, device_id)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'synced',?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           claimed=excluded.claimed, claim_item_id=excluded.claim_item_id,
           link_status=excluded.link_status, sync_status='synced',
           updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
        [
          p.id, p.statement_id ?? null, p.trans_no ?? null, p.sector ?? null,
          p.amount_cents ?? 0, p.currency ?? "MYR",
          p.transaction_date ?? now, p.entry_location ?? null, p.exit_location ?? null,
          p.claimed ? 1 : 0, p.claim_item_id ?? null, p.link_status ?? null,
          p.created_at ?? now, p.updated_at ?? now,
          p.deleted_at ?? null, p.device_id ?? "server",
        ] as BindRow
      );
      break;

    case "commitment":
      await db.runAsync(
        `INSERT INTO commitments (id, space_id, title, amount_cents, currency,
           due_day, status, document_receipt_id,
           sync_status, created_at, updated_at, deleted_at, device_id)
         VALUES (?,?,?,?,?,?,?,?,'synced',?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, amount_cents=excluded.amount_cents,
           due_day=excluded.due_day, status=excluded.status,
           sync_status='synced', updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
        [
          p.id, p.space_id ?? null, p.name ?? p.title ?? "",
          p.amount_cents ?? 0, p.currency ?? "MYR",
          p.due_day ?? null, p.status ?? "ACTIVE",
          p.document_receipt_id ?? null,
          p.created_at ?? now, p.updated_at ?? now,
          p.deleted_at ?? null, p.device_id ?? "server",
        ] as BindRow
      );
      break;

    case "subscription":
      // Tier changes in Supabase propagate to device on every pull
      await db.runAsync(
        `INSERT INTO subscriptions_cache
           (id, owner_type, owner_id, tier, status, current_period_end, seat_count, sync_status, updated_at)
         VALUES (?,?,?,?,?,?,?,'synced',?)
         ON CONFLICT(id) DO UPDATE SET
           tier=excluded.tier,
           status=excluded.status,
           current_period_end=excluded.current_period_end,
           seat_count=excluded.seat_count,
           sync_status='synced',
           updated_at=excluded.updated_at`,
        [
          p.id,
          p.owner_type ?? "user",
          p.owner_id ?? "",
          p.tier ?? "FREE",
          p.status ?? "active",
          p.current_period_end ?? null,
          p.seat_count ?? null,
          p.updated_at ?? now,
        ] as BindRow
      );
      break;

    default:
      // Unknown entity type — skip
      break;
  }
}

async function softDeleteEntity(
  db: Awaited<ReturnType<typeof getDatabase>>,
  entityType: string,
  entityId: string,
  now: string
): Promise<void> {
  const tableMap: Record<string, string> = {
    claim: "claims",
    claim_item: "claim_items",
    trip: "trips",
    receipt: "receipts",
    ledger_entry: "ledger_entries",
    commitment: "commitments",
  };
  const table = tableMap[entityType];
  if (!table) return;
  await db.runAsync(
    `UPDATE ${table} SET deleted_at = ?, updated_at = ?, sync_status = 'synced' WHERE id = ?`,
    [now, now, entityId]
  );
}
