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
  // Rich metadata fields (migration 13)
  meal_session: string | null;
  lodging_check_in: string | null;
  lodging_check_out: string | null;
  perdiem_days: number | null;
  perdiem_rate_myr: number | null;
  perdiem_destination: string | null;
  merchant: string | null;
  qty: number | null;
  unit: string | null;
  rate_per_unit: number | null;
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
    deviceId,
    mealSession: input.mealSession ?? null,
    lodgingCheckIn: input.lodgingCheckIn ?? null,
    lodgingCheckOut: input.lodgingCheckOut ?? null,
    perdiemDays: input.perdiemDays ?? null,
    perdiemRateMyr: input.perdiemRateMyr ?? null,
    perdiemDestination: input.perdiemDestination ?? null,
    merchant: input.merchant ?? null,
    qty: input.qty ?? null,
    unit: input.unit ?? null,
    ratePerUnit: input.ratePerUnit ?? null
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
        device_id,
        meal_session,
        lodging_check_in,
        lodging_check_out,
        perdiem_days,
        perdiem_rate_myr,
        perdiem_destination,
        merchant,
        qty,
        unit,
        rate_per_unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
        item.deviceId,
        item.mealSession,
        item.lodgingCheckIn,
        item.lodgingCheckOut,
        item.perdiemDays,
        item.perdiemRateMyr,
        item.perdiemDestination,
        item.merchant,
        item.qty,
        item.unit,
        item.ratePerUnit
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
    mode:
      Object.prototype.hasOwnProperty.call(input, "mode")
        ? input.mode ?? null
        : existing.mode,
    receiptId:
      Object.prototype.hasOwnProperty.call(input, "receiptId")
        ? input.receiptId ?? null
        : existing.receipt_id,
    syncStatus: "pending" as const,
    tngTransactionId:
      Object.prototype.hasOwnProperty.call(input, "tngTransactionId")
        ? input.tngTransactionId ?? null
        : existing.tng_transaction_id,
    title: input.title ?? existing.title,
    type: input.type ?? existing.type,
    updatedAt: timestamp,
    mealSession:
      Object.prototype.hasOwnProperty.call(input, "mealSession")
        ? input.mealSession ?? null
        : existing.meal_session,
    lodgingCheckIn:
      Object.prototype.hasOwnProperty.call(input, "lodgingCheckIn")
        ? input.lodgingCheckIn ?? null
        : existing.lodging_check_in,
    lodgingCheckOut:
      Object.prototype.hasOwnProperty.call(input, "lodgingCheckOut")
        ? input.lodgingCheckOut ?? null
        : existing.lodging_check_out,
    perdiemDays:
      Object.prototype.hasOwnProperty.call(input, "perdiemDays")
        ? input.perdiemDays ?? null
        : existing.perdiem_days,
    perdiemRateMyr:
      Object.prototype.hasOwnProperty.call(input, "perdiemRateMyr")
        ? input.perdiemRateMyr ?? null
        : existing.perdiem_rate_myr,
    perdiemDestination:
      Object.prototype.hasOwnProperty.call(input, "perdiemDestination")
        ? input.perdiemDestination ?? null
        : existing.perdiem_destination,
    merchant:
      Object.prototype.hasOwnProperty.call(input, "merchant")
        ? input.merchant ?? null
        : existing.merchant,
    qty:
      Object.prototype.hasOwnProperty.call(input, "qty")
        ? input.qty ?? null
        : existing.qty,
    unit:
      Object.prototype.hasOwnProperty.call(input, "unit")
        ? input.unit ?? null
        : existing.unit,
    ratePerUnit:
      Object.prototype.hasOwnProperty.call(input, "ratePerUnit")
        ? input.ratePerUnit ?? null
        : existing.rate_per_unit
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE claim_items
        SET type = ?,
            title = ?,
            amount_cents = ?,
            item_date = ?,
            notes = ?,
            mode = ?,
            receipt_id = ?,
            tng_transaction_id = ?,
            meal_session = ?,
            lodging_check_in = ?,
            lodging_check_out = ?,
            perdiem_days = ?,
            perdiem_rate_myr = ?,
            perdiem_destination = ?,
            merchant = ?,
            qty = ?,
            unit = ?,
            rate_per_unit = ?,
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
        updatedItem.mode,
        updatedItem.receiptId,
        updatedItem.tngTransactionId,
        updatedItem.mealSession,
        updatedItem.lodgingCheckIn,
        updatedItem.lodgingCheckOut,
        updatedItem.perdiemDays,
        updatedItem.perdiemRateMyr,
        updatedItem.perdiemDestination,
        updatedItem.merchant,
        updatedItem.qty,
        updatedItem.unit,
        updatedItem.ratePerUnit,
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
          mode: updatedItem.mode,
          notes: updatedItem.notes,
          receiptId: updatedItem.receiptId,
          tngTransactionId: updatedItem.tngTransactionId,
          updatedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });

  return updatedItem;
}

export async function linkTngTransactionToClaimItem(
  input: { claimId: string; itemId: string; transactionId: string },
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const claim = await getClaimDraft(input.claimId);

  if (!claim || claim.status !== "draft") {
    return null;
  }

  const item = await database.getFirstAsync<ClaimItemRow>(
    `SELECT *
      FROM claim_items
      WHERE id = ?
        AND claim_id = ?
        AND deleted_at IS NULL;`,
    [input.itemId, input.claimId]
  );
  const transaction = await database.getFirstAsync<{
    amount_cents: number;
    claim_item_id: string | null;
    claimed: number;
    currency: string;
    id: string;
  }>(
    `SELECT id, amount_cents, currency, claimed, claim_item_id
      FROM tng_transactions
      WHERE id = ?
        AND deleted_at IS NULL;`,
    [input.transactionId]
  );

  if (!item || !transaction) {
    return null;
  }

  if (transaction.claimed === 1 && transaction.claim_item_id !== input.itemId) {
    throw new Error("This TNG transaction is already linked to another item.");
  }

  const delta = transaction.amount_cents - item.amount_cents;

  await database.withTransactionAsync(async () => {
    if (item.tng_transaction_id && item.tng_transaction_id !== input.transactionId) {
      await database.runAsync(
        `UPDATE tng_transactions
          SET claimed = 0,
              claim_item_id = NULL,
              linked_claim_id = NULL,
              link_status = 'unlinked',
              sync_status = 'pending',
              updated_at = ?
          WHERE id = ?;`,
        [timestamp, item.tng_transaction_id]
      );
    }

    await database.runAsync(
      `UPDATE claim_items
        SET amount_cents = ?,
            currency = ?,
            mode = 'tng_linked',
            tng_transaction_id = ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?
          AND deleted_at IS NULL;`,
      [
        transaction.amount_cents,
        transaction.currency,
        transaction.id,
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
      [delta, timestamp, input.claimId]
    );

    await database.runAsync(
      `UPDATE tng_transactions
        SET claimed = 1,
            claim_item_id = ?,
            linked_claim_id = ?,
            link_status = 'linked',
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?
          AND deleted_at IS NULL;`,
      [input.itemId, input.claimId, timestamp, input.transactionId]
    );

    await enqueueSyncItem(
      {
        entityType: "claim_item",
        entityId: input.itemId,
        operation: "update",
        payload: JSON.stringify({
          amountCents: transaction.amount_cents,
          deviceId,
          id: input.itemId,
          mode: "tng_linked",
          tngTransactionId: transaction.id,
          updatedAt: timestamp
        })
      },
      database
    );
    await enqueueSyncItem(
      {
        entityType: "tng_transaction",
        entityId: input.transactionId,
        operation: "update",
        payload: JSON.stringify({
          claimItemId: input.itemId,
          claimed: true,
          deviceId,
          id: input.transactionId,
          linkedClaimId: input.claimId,
          linkStatus: "linked",
          updatedAt: timestamp
        })
      },
      database
    );
  });

  return getLatestClaimItem(input.claimId);
}

export async function unlinkTngTransactionFromClaimItem(
  itemId: string,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const item = await database.getFirstAsync<ClaimItemRow>(
    `SELECT *
      FROM claim_items
      WHERE id = ?
        AND deleted_at IS NULL;`,
    [itemId]
  );

  if (!item || !item.tng_transaction_id) {
    return null;
  }
  const transactionId = item.tng_transaction_id;

  const claim = await getClaimDraft(item.claim_id);
  if (!claim || claim.status !== "draft") {
    return null;
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE tng_transactions
        SET claimed = 0,
            claim_item_id = NULL,
            linked_claim_id = NULL,
            link_status = 'unlinked',
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?;`,
      [timestamp, transactionId]
    );

    await database.runAsync(
      `UPDATE claim_items
        SET amount_cents = 0,
            mode = 'tng_pending',
            tng_transaction_id = NULL,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?;`,
      [timestamp, itemId]
    );

    await database.runAsync(
      `UPDATE claims
        SET total_amount_cents = total_amount_cents - ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?;`,
      [item.amount_cents, timestamp, item.claim_id]
    );

    await enqueueSyncItem(
      {
        entityType: "claim_item",
        entityId: itemId,
        operation: "update",
        payload: JSON.stringify({
          amountCents: 0,
          deviceId,
          id: itemId,
          mode: "tng_pending",
          tngTransactionId: null,
          updatedAt: timestamp
        })
      },
      database
    );
    await enqueueSyncItem(
      {
        entityType: "tng_transaction",
        entityId: transactionId,
        operation: "update",
        payload: JSON.stringify({
          claimItemId: null,
          claimed: false,
          deviceId,
          id: transactionId,
          linkedClaimId: null,
          linkStatus: "unlinked",
          updatedAt: timestamp
        })
      },
      database
    );
  });

  return getLatestClaimItem(item.claim_id);
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
    if (existing.tng_transaction_id) {
      await database.runAsync(
        `UPDATE tng_transactions
          SET claimed = 0,
              claim_item_id = NULL,
              linked_claim_id = NULL,
              link_status = 'unlinked',
              sync_status = 'pending',
              updated_at = ?
          WHERE id = ?;`,
        [timestamp, existing.tng_transaction_id]
      );
    }

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

    if (existing.tng_transaction_id) {
      await enqueueSyncItem(
        {
          entityType: "tng_transaction",
          entityId: existing.tng_transaction_id,
          operation: "update",
          payload: JSON.stringify({
            claimItemId: null,
            claimed: false,
            deviceId,
            id: existing.tng_transaction_id,
            linkedClaimId: null,
            linkStatus: "unlinked",
            updatedAt: timestamp
          })
        },
        database
      );
    }
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
    deviceId: row.device_id,
    mealSession: row.meal_session ?? null,
    lodgingCheckIn: row.lodging_check_in ?? null,
    lodgingCheckOut: row.lodging_check_out ?? null,
    perdiemDays: row.perdiem_days ?? null,
    perdiemRateMyr: row.perdiem_rate_myr ?? null,
    perdiemDestination: row.perdiem_destination ?? null,
    merchant: row.merchant ?? null,
    qty: row.qty ?? null,
    unit: row.unit ?? null,
    ratePerUnit: row.rate_per_unit ?? null
  };
}

