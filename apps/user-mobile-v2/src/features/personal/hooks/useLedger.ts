import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLedgerEntry,
  deleteLedgerEntry,
  updateLedgerEntry,
  listLedgerEntries,
  listLedgerEntriesForYear,
} from "@/local-db/repositories/ledgerRepository";
import type { UpdateLedgerEntryInput } from "@/local-db/repositories/ledgerRepository";
import type { CreateLedgerEntryInput, LedgerEntryType, SpaceType } from "@/features/personal/types";
import { useDeviceStore } from "@/state/deviceStore";

export function useLedgerEntries(spaceType: SpaceType, month: number, year: number, entryType?: LedgerEntryType) {
  return useQuery({
    queryKey: ["ledger", spaceType, year, month, entryType ?? "all"],
    queryFn: () => listLedgerEntries(spaceType, month, year, entryType),
  });
}

export function useLedgerEntriesForYear(spaceType: SpaceType, year: number) {
  return useQuery({
    queryKey: ["ledger", spaceType, year],
    queryFn: () => listLedgerEntriesForYear(spaceType, year),
  });
}

export function useCreateLedgerEntry() {
  const qc = useQueryClient();
  const deviceId = useDeviceStore((s) => s.deviceId);
  return useMutation({
    mutationFn: (input: CreateLedgerEntryInput) => createLedgerEntry(input, deviceId),
    onSuccess: (entry) => {
      qc.invalidateQueries({ queryKey: ["ledger", entry.spaceType] });
    },
  });
}

export function useUpdateLedgerEntry(spaceType: SpaceType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateLedgerEntryInput) => updateLedgerEntry(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledger", spaceType] });
    },
  });
}

export function useDeleteLedgerEntry(spaceType: SpaceType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLedgerEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ledger", spaceType] });
    },
  });
}
