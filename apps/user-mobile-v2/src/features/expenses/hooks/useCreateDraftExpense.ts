import { useMutation, useQueryClient } from "@tanstack/react-query";

import { expenseQueryKeys } from "@/features/expenses/hooks/useExpenseDrafts";
import { createExpenseDraft } from "@/local-db/repositories/expenseRepository";
import { useDeviceStore } from "@/state/deviceStore";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";

const sampleMerchants = [
  "Grab ride",
  "Kopitiam lunch",
  "Client parking",
  "Toll charge"
] as const;

export function useCreateDraftExpense() {
  const queryClient = useQueryClient();
  const deviceId = useDeviceStore((state) => state.deviceId);

  return useMutation({
    mutationFn: () =>
      createExpenseDraft(
        {
          amountCents: 1250,
          currency: "MYR",
          expenseDate: new Date().toISOString().slice(0, 10),
          merchantName:
            sampleMerchants[Math.floor(Math.random() * sampleMerchants.length)],
          notes: "Created from the v2 local-first scaffold."
        },
        deviceId
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: expenseQueryKeys.drafts
      });
      void queryClient.invalidateQueries({
        queryKey: syncQueryKeys.pendingItems
      });
    }
  });
}

