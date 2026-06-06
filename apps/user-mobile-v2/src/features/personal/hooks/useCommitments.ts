import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommitment,
  deactivateCommitment,
  updateCommitment,
  getCommitmentById,
  listCommitments,
  listPaymentsForCommitment,
  listPaymentsForMonth,
  updatePaymentStatus,
  upsertPayment,
} from "@/local-db/repositories/commitmentRepository";
import type { CreateCommitmentInput, UpdatePaymentInput } from "@/features/personal/types";
import { useDeviceStore } from "@/state/deviceStore";

export function useCommitments(activeOnly = true) {
  return useQuery({
    queryKey: ["commitments", activeOnly],
    queryFn: () => listCommitments(activeOnly),
  });
}

export function useCommitment(id: string | null) {
  return useQuery({
    queryKey: ["commitment", id],
    queryFn: () => (id ? getCommitmentById(id) : null),
    enabled: !!id,
  });
}

export function usePaymentsForCommitment(commitmentId: string | null) {
  return useQuery({
    queryKey: ["commitment_payments", commitmentId],
    queryFn: () => (commitmentId ? listPaymentsForCommitment(commitmentId) : []),
    enabled: !!commitmentId,
  });
}

export function usePaymentsForMonth(month: number, year: number) {
  return useQuery({
    queryKey: ["commitment_payments_month", year, month],
    queryFn: () => listPaymentsForMonth(month, year),
  });
}

export function useCreateCommitment() {
  const qc = useQueryClient();
  const deviceId = useDeviceStore((s) => s.deviceId);
  return useMutation({
    mutationFn: (input: CreateCommitmentInput) => createCommitment(input, deviceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commitments"] });
    },
  });
}

export function useUpdateCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: { name?: string; amountCents?: number; dueDay?: number; notes?: string | null } }) =>
      updateCommitment(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["commitments"] }),
  });
}

export function useDeactivateCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCommitment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commitments"] });
    },
  });
}

export function useUpsertPayment() {
  const qc = useQueryClient();
  const deviceId = useDeviceStore((s) => s.deviceId);
  return useMutation({
    mutationFn: ({
      commitmentId,
      year,
      month,
      expectedAmountCents,
      dueDate,
    }: {
      commitmentId: string;
      year: number;
      month: number;
      expectedAmountCents: number;
      dueDate: string;
    }) => upsertPayment(commitmentId, year, month, expectedAmountCents, dueDate, deviceId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["commitment_payments", vars.commitmentId] });
      qc.invalidateQueries({ queryKey: ["commitment_payments_month"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  const deviceId = useDeviceStore((s) => s.deviceId);
  return useMutation({
    mutationFn: (input: UpdatePaymentInput) => updatePaymentStatus(input, deviceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commitment_payments"] });
      qc.invalidateQueries({ queryKey: ["commitment_payments_month"] });
    },
  });
}
