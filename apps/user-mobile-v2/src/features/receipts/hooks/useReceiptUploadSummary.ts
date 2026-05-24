import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getReceiptDraft,
  getReceiptUploadSummary,
  retryFailedReceiptUploads
} from "@/local-db/repositories/receiptRepository";

export const receiptUploadSummaryQueryKey = ["receipts", "upload-summary"] as const;
export const receiptQueryKeys = {
  detail: (receiptId: string | null | undefined) =>
    ["receipts", "detail", receiptId] as const
};

export function useReceiptDraft(receiptId: string | null | undefined) {
  return useQuery({
    enabled: Boolean(receiptId),
    queryKey: receiptQueryKeys.detail(receiptId),
    queryFn: () => getReceiptDraft(receiptId ?? "")
  });
}

export function useReceiptUploadSummary() {
  return useQuery({
    queryKey: receiptUploadSummaryQueryKey,
    queryFn: getReceiptUploadSummary
  });
}

export function useRetryFailedReceiptUploads() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retryFailedReceiptUploads(25),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: receiptUploadSummaryQueryKey
      });
    }
  });
}

