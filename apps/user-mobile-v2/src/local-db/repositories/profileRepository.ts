import { getDatabase } from "@/local-db/database";
import type { SyncStatus } from "@/features/expenses/types";
import type { CachedProfile } from "@/features/profile/types";
import { nowIso } from "@/utils/time";

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  department: string | null;
  location: string | null;
  company_name: string | null;
  sync_status: SyncStatus;
  updated_at: string;
};

export async function getCachedProfile(id: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ProfileRow>(
    "SELECT * FROM profiles_cache WHERE id = ?;",
    [id]
  );

  return row ? mapProfileRow(row) : null;
}

export async function upsertCachedProfile(
  profile: Omit<CachedProfile, "updatedAt" | "syncStatus"> & {
    syncStatus?: SyncStatus;
    updatedAt?: string;
  }
) {
  const database = await getDatabase();
  const updatedAt = profile.updatedAt ?? nowIso();
  const syncStatus = profile.syncStatus ?? "synced";

  await database.runAsync(
    `INSERT INTO profiles_cache (
      id,
      email,
      display_name,
      department,
      location,
      company_name,
      sync_status,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      display_name = excluded.display_name,
      department = excluded.department,
      location = excluded.location,
      company_name = excluded.company_name,
      sync_status = excluded.sync_status,
      updated_at = excluded.updated_at;`,
    [
      profile.id,
      profile.email,
      profile.displayName,
      profile.department,
      profile.location,
      profile.companyName,
      syncStatus,
      updatedAt
    ]
  );
}

function mapProfileRow(row: ProfileRow): CachedProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    department: row.department,
    location: row.location,
    companyName: row.company_name,
    syncStatus: row.sync_status,
    updatedAt: row.updated_at
  };
}

