import { getDatabase } from "@/local-db/database";
import { enqueueSyncItem } from "@/local-db/repositories/syncQueueRepository";
import type {
  ClaimDraft,
  ClaimItemDraft,
  ClaimItemType,
  ClaimStatus,
  CreateClaimDraftInput,
  CreateClaimItemDraftInput,
  UpdateClaimDraftInput,
  UpdateClaimItemDraftInput
} from "@/features/claims/types";
import { createReceiptDraft } from "@/local-db/repositories/receiptRepository";
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

export async function getClaimDraft(claimId: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ClaimRow>(
    `SELECT *
      FROM claims
      WHERE id = ?
        AND deleted_at IS NULL;`,
    [claimId]
  );

  return row ? mapClaimRow(row) : null;
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
    title: input.title === undefined ? "Draft claim" : input.title,
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

export async function updateClaimDraft(
  input: UpdateClaimDraftInput,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const existing = await getClaimDraft(input.claimId);

  if (!existing || existing.status !== "draft") {
    return null;
  }

  const updatedClaim = {
    ...existing,
    title: input.title ?? existing.title,
    periodStart: input.periodStart ?? existing.periodStart,
    periodEnd: input.periodEnd ?? existing.periodEnd,
    syncStatus: "pending" as const,
    updatedAt: timestamp
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE claims
        SET title = ?,
            period_start = ?,
            period_end = ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?
          AND status = 'draft'
          AND deleted_at IS NULL;`,
      [
        updatedClaim.title,
        updatedClaim.periodStart,
        updatedClaim.periodEnd,
        timestamp,
        input.claimId
      ]
    );

    await enqueueSyncItem(
      {
        entityType: "claim",
        entityId: input.claimId,
        operation: "update",
        payload: JSON.stringify({
          id: input.claimId,
          title: updatedClaim.title,
          periodStart: updatedClaim.periodStart,
          periodEnd: updatedClaim.periodEnd,
          updatedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });

  return updatedClaim;
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

export async function submitClaimDraft(claimId: string, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const existing = await getClaimDraft(claimId);

  if (!existing || existing.status !== "draft") {
    return null;
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE claims
        SET status = 'submitted',
            submitted_at = ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?
          AND status = 'draft'
          AND deleted_at IS NULL;`,
      [timestamp, timestamp, claimId]
    );

    await enqueueSyncItem(
      {
        entityType: "claim",
        entityId: claimId,
        operation: "update",
        payload: JSON.stringify({
          id: claimId,
          status: "submitted",
          submittedAt: timestamp,
          updatedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });

  return {
    ...existing,
    status: "submitted" as const,
    submittedAt: timestamp,
    syncStatus: "pending" as const,
    updatedAt: timestamp
  };
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

export async function updateClaimItemDraft(
  input: UpdateClaimItemDraftInput,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const existing = await database.getFirstAsync<ClaimItemRow>(
    `SELECT *
      FROM claim_items
      WHERE id = ?
        AND deleted_at IS NULL;`,
    [input.itemId]
  );

  if (!existing) {
    return null;
  }

  const claim = await getClaimDraft(existing.claim_id);

  if (!claim || claim.status !== "draft") {
    return null;
  }

  const nextAmountCents = input.amountCents ?? existing.amount_cents;
  const delta = nextAmountCents - existing.amount_cents;
  const updatedItem = {
    ...mapClaimItemRow(existing),
    amountCents: nextAmountCents,
    itemDate: input.itemDate ?? existing.item_date,
    notes: input.notes ?? existing.notes,
    receiptId:
      Object.prototype.hasOwnProperty.call(input, "receiptId")
        ? input.receiptId ?? null
        : existing.receipt_id,
    syncStatus: "pending" as const,
    title: input.title ?? existing.title,
    type: input.type ?? existing.type,
    updatedAt: timestamp
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE claim_items
        SET type = ?,
            title = ?,
            amount_cents = ?,
            item_date = ?,
            notes = ?,
            receipt_id = ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?
          AND deleted_at IS NULL;`,
      [
        updatedItem.type,
        updatedItem.title,
        updatedItem.amountCents,
        updatedItem.itemDate,
        updatedItem.notes,
        updatedItem.receiptId,
        timestamp,
        input.itemId
      ]
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
        entityId: input.itemId,
        operation: "update",
        payload: JSON.stringify({
          id: input.itemId,
          type: updatedItem.type,
          title: updatedItem.title,
          amountCents: updatedItem.amountCents,
          itemDate: updatedItem.itemDate,
          notes: updatedItem.notes,
          receiptId: updatedItem.receiptId,
          updatedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });

  return updatedItem;
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

export async function attachReceiptMetadataToClaimItem(
  itemId: string,
  deviceId: string,
  file?: {
    fileSize?: number | null;
    localUri?: string | null;
    mimeType?: string | null;
  }
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

  const claim = await getClaimDraft(existing.claim_id);

  if (!claim || claim.status !== "draft") {
    return null;
  }

  const receipt = await createReceiptDraft(
    {
      ownerEntityType: "claim_item",
      ownerEntityId: itemId,
      localUri: file?.localUri ?? `local://receipt/${itemId}/${timestamp}`,
      mimeType: file?.mimeType ?? "image/jpeg",
      fileSize: file?.fileSize ?? null
    },
    deviceId
  );

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE claim_items
        SET receipt_id = ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?
          AND deleted_at IS NULL;`,
      [receipt.id, timestamp, itemId]
    );

    await database.runAsync(
      `UPDATE claims
        SET sync_status = 'pending',
            updated_at = ?
        WHERE id = ?;`,
      [timestamp, existing.claim_id]
    );

    await enqueueSyncItem(
      {
        entityType: "claim_item",
        entityId: itemId,
        operation: "update",
        payload: JSON.stringify({
          id: itemId,
          receiptId: receipt.id,
          updatedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });

  return receipt;
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

