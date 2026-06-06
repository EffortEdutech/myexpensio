import {
  useCreateLedgerEntry,
  useDeleteLedgerEntry,
  useUpdateLedgerEntry,
  useLedgerEntries,
  useLedgerEntriesForYear,
} from "@/features/personal/hooks/useLedger";

export function useBusinessEntries(month: number, year: number, type?: "INCOME" | "EXPENSE") {
  return useLedgerEntries("BUSINESS", month, year, type);
}

export function useBusinessEntriesForYear(year: number) {
  return useLedgerEntriesForYear("BUSINESS", year);
}

export { useCreateLedgerEntry as useCreateBusinessEntry };
export { useDeleteLedgerEntry };
export { useUpdateLedgerEntry };
