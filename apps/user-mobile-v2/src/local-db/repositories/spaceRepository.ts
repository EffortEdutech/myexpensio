import { getDatabase } from "@/local-db/database";
import type { CachedSpace, UpsertCachedSpaceInput } from "@/features/spaces/types";
import type { SyncStatus } from "@/features/expenses/types";
import type { AppSpace } from "@/features/shell/types";
import { nowIso } from "@/utils/time";

type SpaceRow = {
  id: string;
  type: AppSpace;
  name: string;
  currency: string;
  is_default: number;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  device_id: string;
};

export async function listCachedSpaces() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SpaceRow>(
    `SELECT *
      FROM spaces
      WHERE deleted_at IS NULL
      ORDER BY is_default DESC, name ASC;`
  );

  return rows.map(mapSpaceRow);
}

export async function upsertCachedSpace(input: UpsertCachedSpaceInput) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const createdAt = input.createdAt ?? timestamp;
  const updatedAt = input.updatedAt ?? timestamp;
  const syncStatus = input.syncStatus ?? "synced";

  await database.runAsync(
    `INSERT INTO spaces (
      id,
      type,
      name,
      currency,
      is_default,
      sync_status,
      created_at,
      updated_at,
      deleted_at,
      device_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      type = excluded.type,
      name = excluded.name,
      currency = excluded.currency,
      is_default = excluded.is_default,
      sync_status = excluded.sync_status,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      device_id = excluded.device_id;`,
    [
      input.id,
      input.type,
      input.name,
      input.currency,
      input.isDefault ? 1 : 0,
      syncStatus,
      createdAt,
      updatedAt,
      input.deletedAt ?? null,
      input.deviceId
    ]
  );
}

function mapSpaceRow(row: SpaceRow): CachedSpace {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    currency: row.currency,
    isDefault: row.is_default === 1,
    syncStatus: row.sync_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deviceId: row.device_id
  };
}

