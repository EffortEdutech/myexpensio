/**
 * AiReviewModal.tsx
 *
 * AI Capture — Review Sheet (2026-07-18)
 *
 * Replaces the old "silently auto-fill a field only if it still looks empty
 * / still today's default" heuristic that used to live inline in
 * ClaimDetail.tsx's handleAiExtracted(). That heuristic had two failure
 * modes reported by Eff while testing:
 *   1. The "date still equals today's default" guard could desync from the
 *      date picker around UTC/local day boundaries (see the toLocalDateInput
 *      fix in ClaimDetail.tsx) — so a correctly-extracted receipt date would
 *      silently never get applied.
 *   2. There was zero visibility into which specific field the AI failed to
 *      read — amount/merchant might fill while date silently didn't, with no
 *      indication why.
 *
 * This modal shows exactly what Gemini read off the receipt next to what's
 * currently in the form, lets the user opt in/out per field (default: opt
 * in for every field the AI actually returned), and only applies what they
 * explicitly confirm via "Apply Selected". Used by both AddClaimItemModal
 * and EditClaimItemModal in ClaimDetail.tsx.
 */
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme/tokens";

import type { AiExtractedFields } from "./ClaimDetail";

export type AiReviewSelection = {
  amount?: number;
  date?: string;
  merchant?: string;
};

type Props = {
  currentAmount: string; // raw form value, e.g. "" or "12.50"
  currentDate: string; // yyyy-mm-dd
  currentMerchant: string;
  fields: AiExtractedFields | null;
  merchantLabel: string; // "Description" (Add) or "Title" (Edit)
  onApply: (selection: AiReviewSelection) => void;
  onDismiss: () => void;
  visible: boolean;
};

function formatDateForDisplay(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function AiReviewModal({
  currentAmount,
  currentDate,
  currentMerchant,
  fields,
  merchantLabel,
  onApply,
  onDismiss,
  visible
}: Props) {
  const hasAmount = fields?.amount != null;
  const hasDate = !!fields?.date;
  const hasMerchant = !!fields?.merchant;
  const hasAnyField = hasAmount || hasDate || hasMerchant;

  const [useAmount, setUseAmount] = useState(hasAmount);
  const [useDate, setUseDate] = useState(hasDate);
  const [useMerchant, setUseMerchant] = useState(hasMerchant);

  // Reset checkbox defaults whenever a fresh extraction comes in.
  useEffect(() => {
    setUseAmount(hasAmount);
    setUseDate(hasDate);
    setUseMerchant(hasMerchant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  if (!visible || !fields) return null;

  function handleApply() {
    if (!fields) return;
    onApply({
      amount: useAmount && fields.amount != null ? fields.amount : undefined,
      date: useDate && fields.date ? fields.date : undefined,
      merchant: useMerchant && fields.merchant ? fields.merchant : undefined
    });
  }

  return (
    <Modal animationType="fade" onRequestClose={onDismiss} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>🤖 Review AI-Read Receipt</Text>
            <ConfidenceBadge confidence={fields.confidence} />
          </View>

          {!hasAnyField ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                AI couldn't confidently read anything from this receipt. Please enter the details
                manually.
              </Text>
            </View>
          ) : (
            <View style={styles.rows}>
              {hasAmount ? (
                <ReviewRow
                  checked={useAmount}
                  currentValue={currentAmount ? `MYR ${currentAmount}` : "empty"}
                  label="Amount"
                  newValue={`MYR ${fields.amount!.toFixed(2)}`}
                  onToggle={() => setUseAmount((p) => !p)}
                />
              ) : (
                <ReviewRowMissing label="Amount" />
              )}
              {hasDate ? (
                <ReviewRow
                  checked={useDate}
                  currentValue={formatDateForDisplay(currentDate)}
                  label="Date"
                  newValue={formatDateForDisplay(fields.date!)}
                  onToggle={() => setUseDate((p) => !p)}
                />
              ) : (
                <ReviewRowMissing label="Date" />
              )}
              {hasMerchant ? (
                <ReviewRow
                  checked={useMerchant}
                  currentValue={currentMerchant || "empty"}
                  label={merchantLabel}
                  newValue={fields.merchant!}
                  onToggle={() => setUseMerchant((p) => !p)}
                />
              ) : (
                <ReviewRowMissing label={merchantLabel} />
              )}
            </View>
          )}

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>
            {hasAnyField ? (
              <Pressable accessibilityRole="button" onPress={handleApply} style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Apply Selected</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfidenceBadge({ confidence }: { confidence: AiExtractedFields["confidence"] }) {
  const meta =
    confidence === "HIGH"
      ? { bg: "#dcfce7", color: "#15803d", label: "High confidence" }
      : confidence === "MEDIUM"
        ? { bg: "#fef3c7", color: "#b45309", label: "Medium confidence" }
        : { bg: "#fee2e2", color: "#b91c1c", label: "Low confidence" };
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

function ReviewRow({
  checked,
  currentValue,
  label,
  newValue,
  onToggle
}: {
  checked: boolean;
  currentValue: string;
  label: string;
  newValue: string;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={styles.row}
    >
      <View style={[styles.checkbox, checked ? styles.checkboxChecked : null]}>
        {checked ? <Text style={styles.checkboxMark}>✓</Text> : null}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={styles.rowValueLine}>
          <Text style={styles.rowValueNew}>{newValue}</Text>
          {currentValue !== "empty" ? (
            <Text style={styles.rowValueOld}> (was {currentValue})</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function ReviewRowMissing({ label }: { label: string }) {
  return (
    <View style={[styles.row, styles.rowMissing]}>
      <View style={styles.checkboxDisabled} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabelMuted}>{label}</Text>
        <Text style={styles.rowValueMuted}>AI couldn't read this field</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    gap: spacing.md,
    maxWidth: 420,
    padding: spacing.lg,
    width: "100%"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: typography.body,
    fontWeight: "900"
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900"
  },
  emptyState: {
    paddingVertical: spacing.md
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "600",
    lineHeight: 20
  },
  rows: {
    gap: spacing.sm
  },
  row: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  rowMissing: {
    opacity: 0.6
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkboxDisabled: {
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    width: 22
  },
  checkboxMark: {
    color: colors.onPrimary ?? "#ffffff",
    fontSize: 13,
    fontWeight: "900"
  },
  rowBody: {
    flex: 1,
    gap: 2
  },
  rowLabel: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  rowLabelMuted: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  rowValueLine: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  rowValueNew: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  rowValueOld: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600"
  },
  rowValueMuted: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "600"
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md
  },
  skipButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46
  },
  skipButtonText: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: "900"
  },
  applyButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    flex: 2,
    justifyContent: "center",
    minHeight: 46
  },
  applyButtonText: {
    color: colors.onPrimary ?? "#ffffff",
    fontSize: typography.body,
    fontWeight: "900"
  }
});
