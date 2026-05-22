import type { SyncStatus } from "@/features/expenses/types";
import type { AppSpace } from "@/features/shell/types";

export type CachedSpace = {
  id: string;
  type: AppSpace;
  name: string;
  currency: string;
  isDefault: boolean;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deviceId: string;
};

export type UpsertCachedSpaceInput = Omit<
  CachedSpace,
  "createdAt" | "updatedAt" | "deletedAt" | "deviceId" | "syncStatus"
> & {
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  deviceId: string;
  syncStatus?: SyncStatus;
};

