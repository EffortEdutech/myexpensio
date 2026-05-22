import type { SyncStatus } from "@/features/expenses/types";

export type CachedProfile = {
  id: string;
  email: string | null;
  displayName: string | null;
  department: string | null;
  location: string | null;
  companyName: string | null;
  syncStatus: SyncStatus;
  updatedAt: string;
};

