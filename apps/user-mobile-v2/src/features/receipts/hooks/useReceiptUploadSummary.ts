import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getReceiptUploadSummary,
  retryFailedReceiptUploads
} from "@/local-db/repositories/receiptRepository";

export const receiptUploadSummaryQueryKey = ["receipts", "upload-summary"] as const;

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

