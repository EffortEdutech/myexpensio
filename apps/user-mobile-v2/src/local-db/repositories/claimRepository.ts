import { getDatabase } from "@/local-db/database";
import { enqueueSyncItem } from "@/local-db/repositories/syncQueueRepository";
import type {
  ClaimDraft,
  ClaimItemDraft,
  ClaimItemType,
  ClaimStatus,
  CreateClaimDraftInput,
  CreateClaimItemDraftInput
} from "@/features/claims/types";
import type { SyncStatus } from "@/features/expenses/types";
import { createId } from "@/utils/ids";
import { nowIso } from "@/utils/time";

type ClaimRow = {
  id: string;
  space_id: string | null;
  title: string | null;
  status: ClaimStatus;
  period_start: string | null;
  period_end: string | null;
  total_amount_cents: number;
  currency: string;
  submitted_at: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  device_id: string;
};

type ClaimItemRow = {
  id: string;
  claim_id: string;
  type: ClaimItemType;
  mode: string | null;
  title: string;
  amount_cents: number;
  currency: string;
  item_date: string;
  notes: string | null;
  receipt_id: string | null;
  trip_id: string | null;
  tng_transaction_id: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  device_id: string;
};

export async function listClaimDrafts() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ClaimRow>(
    `SELECT *
      FROM claims
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC;`
  );

  return rows.map(mapClaimRow);
}

export async function listClaimItems(claimId: string) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ClaimItemRow>(
    `SELECT *
      FROM claim_items
      WHERE claim_id = ? AND deleted_at IS NULL
      ORDER BY created_at DESC;`,
    [claimId]
  );

  return rows.map(mapClaimItemRow);
}

export async function createClaimDraft(
  input: CreateClaimDraftInput,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const claim: ClaimDraft = {
    id: createId("claim"),
    spaceId: input.spaceId ?? null,
    title: input.title ?? "Draft claim",
    status: "draft",
    periodStart: input.periodStart ?? null,
    periodEnd: input.periodEnd ?? null,
    totalAmountCents: 0,
    currency: input.currency ?? "MYR",
    submittedAt: null,
    syncStatus: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    deviceId
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO claims (
        id,
        space_id,
        title,
        status,
        period_start,
        period_end,
        total_amount_cents,
        currency,
        submitted_at,
        sync_status,
        created_at,
        updated_at,
        deleted_at,
        device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        claim.id,
        claim.spaceId,
        claim.title,
        claim.status,
        claim.periodStart,
        claim.periodEnd,
        claim.totalAmountCents,
        claim.currency,
        claim.submittedAt,
        claim.syncStatus,
        claim.createdAt,
        claim.updatedAt,
        claim.deletedAt,
        claim.deviceId
      ]
    );

    await enqueueSyncItem(
      {
        entityType: "claim",
        entityId: claim.id,
        operation: "create",
        payload: JSON.stringify(claim)
      },
      database
    );
  });

  return claim;
}

export async function createClaimItemDraft(
  input: CreateClaimItemDraftInput,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const item: ClaimItemDraft = {
    id: createId("claim_item"),
    claimId: input.claimId,
    type: input.type,
    mode: input.mode ?? null,
    title: input.title,
    amountCents: input.amountCents,
    currency: input.currency ?? "MYR",
    itemDate: input.itemDate,
    notes: input.notes ?? null,
    receiptId: input.receiptId ?? null,
    tripId: input.tripId ?? null,
    tngTransactionId: input.tngTransactionId ?? null,
    syncStatus: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    deviceId
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO claim_items (
        id,
        claim_id,
        type,
        mode,
        title,
        amount_cents,
        currency,
        item_date,
        notes,
        receipt_id,
        trip_id,
        tng_transaction_id,
        sync_status,
        created_at,
        updated_at,
        deleted_at,
        device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        item.id,
        item.claimId,
        item.type,
        item.mode,
        item.title,
        item.amountCents,
        item.currency,
        item.itemDate,
        item.notes,
        item.receiptId,
        item.tripId,
        item.tngTransactionId,
        item.syncStatus,
        item.createdAt,
        item.updatedAt,
        item.deletedAt,
        item.deviceId
      ]
    );

    await database.runAsync(
      `UPDATE claims
        SET total_amount_cents = total_amount_cents + ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?;`,
      [item.amountCents, timestamp, item.claimId]
    );

    await enqueueSyncItem(
      {
        entityType: "claim_item",
        entityId: item.id,
        operation: "create",
        payload: JSON.stringify(item)
      },
      database
    );
  });

  return item;
}

export async function updateClaimDraftTitle(
  claimId: string,
  title: string,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE claims
        SET title = ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?
          AND status = 'draft'
          AND deleted_at IS NULL;`,
      [title, timestamp, claimId]
    );

    await enqueueSyncItem(
      {
        entityType: "claim",
        entityId: claimId,
        operation: "update",
        payload: JSON.stringify({
          id: claimId,
          title,
          updatedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });
}

export async function softDeleteClaimDraft(claimId: string, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE claims
        SET sync_status = 'deleted',
            deleted_at = ?,
            updated_at = ?
        WHERE id = ?
          AND status = 'draft'
          AND deleted_at IS NULL;`,
      [timestamp, timestamp, claimId]
    );

    await database.runAsync(
      `UPDATE claim_items
        SET sync_status = 'deleted',
            deleted_at = ?,
            updated_at = ?
        WHERE claim_id = ?
          AND deleted_at IS NULL;`,
      [timestamp, timestamp, claimId]
    );

    await enqueueSyncItem(
      {
        entityType: "claim",
        entityId: claimId,
        operation: "delete",
        payload: JSON.stringify({
          id: claimId,
          deletedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });
}

export async function updateClaimItemAmount(
  itemId: string,
  amountCents: number,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const existing = await database.getFirstAsync<ClaimItemRow>(
    `SELECT *
      FROM claim_items
      WHERE id = ?
        AND deleted_at IS NULL;`,
    [itemId]
  );

  if (!existing) {
    return null;
  }

  const delta = amountCents - existing.amount_cents;

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE claim_items
        SET amount_cents = ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?
          AND deleted_at IS NULL;`,
      [amountCents, timestamp, itemId]
    );

    await database.runAsync(
      `UPDATE claims
        SET total_amount_cents = total_amount_cents + ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?;`,
      [delta, timestamp, existing.claim_id]
    );

    await enqueueSyncItem(
      {
        entityType: "claim_item",
        entityId: itemId,
        operation: "update",
        payload: JSON.stringify({
          id: itemId,
          amountCents,
          updatedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });

  return {
    ...mapClaimItemRow(existing),
    amountCents,
    updatedAt: timestamp,
    syncStatus: "pending" as const
  };
}

export async function softDeleteClaimItem(itemId: string, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const existing = await database.getFirstAsync<ClaimItemRow>(
    `SELECT *
      FROM claim_items
      WHERE id = ?
        AND deleted_at IS NULL;`,
    [itemId]
  );

  if (!existing) {
    return null;
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE claim_items
        SET sync_status = 'deleted',
            deleted_at = ?,
            updated_at = ?
        WHERE id = ?;`,
      [timestamp, timestamp, itemId]
    );

    await database.runAsync(
      `UPDATE claims
        SET total_amount_cents = total_amount_cents - ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?;`,
      [existing.amount_cents, timestamp, existing.claim_id]
    );

    await enqueueSyncItem(
      {
        entityType: "claim_item",
        entityId: itemId,
        operation: "delete",
        payload: JSON.stringify({
          id: itemId,
          claimId: existing.claim_id,
          deletedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });

  return mapClaimItemRow(existing);
}

export async function getLatestClaimItem(claimId: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ClaimItemRow>(
    `SELECT *
      FROM claim_items
      WHERE claim_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1;`,
    [claimId]
  );

  return row ? mapClaimItemRow(row) : null;
}

function mapClaimRow(row: ClaimRow): ClaimDraft {
  return {
    id: row.id,
    spaceId: row.space_id,
    title: row.title,
    status: row.status,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    totalAmountCents: row.total_amount_cents,
    currency: row.currency,
    submittedAt: row.submitted_at,
    syncStatus: row.sync_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deviceId: row.device_id
  };
}

function mapClaimItemRow(row: ClaimItemRow): ClaimItemDraft {
  return {
    id: row.id,
    claimId: row.claim_id,
    type: row.type,
    mode: row.mode,
    title: row.title,
    amountCents: row.amount_cents,
    currency: row.currency,
    itemDate: row.item_date,
    notes: row.notes,
    receiptId: row.receipt_id,
    tripId: row.trip_id,
    tngTransactionId: row.tng_transaction_id,
    syncStatus: row.sync_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deviceId: row.device_id
  };
}

