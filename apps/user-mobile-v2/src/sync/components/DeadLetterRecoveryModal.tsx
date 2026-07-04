import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import type { SyncEntityType, SyncOperation, SyncQueueItem } from "@/sync/types";
import {
  useDeadLetterItems,
  useDiscardSyncItem,
  useRetryDeadLetterItem
} from "@/sync/hooks/useDeadLetterRecovery";
import { formatRelativeTime } from "@/utils/time";
import { colors, spacing, typography } from "@/theme/tokens";

const ENTITY_LABELS: Record<SyncEntityType, string> = {
  claim: "Claim",
  claim_item: "Claim item",
  commitment: "Commitment",
  commitment_payment: "Commitment payment",
  expense: "Expense",
  export_job: "Export",
  ledger_entry: "Ledger entry",
  receipt: "Receipt",
  sync_state: "Sync state",
  tng_statement_batch: "TnG statement",
  tng_transaction: "TnG transaction",
  trip: "Trip"
};

const OPERATION_LABELS: Record<SyncOperation, string> = {
  create: "created",
  update: "edited",
  delete: "deleted"
};

type DeadLetterRecoveryModalProps = {
  onClose: () => void;
  visible: boolean;
};

/**
 * Lets the user see and act on sync items that have permanently stopped
 * retrying (retry_count exhausted SYNC_MAX_RETRIES). Before this component
 * existed, the "N need attention" badge in the claims toolbar was purely
 * informational — stuck items were invisible and silently never reached
 * Supabase. This is the fix: each stuck item shows what it was, why it
 * failed (the raw server/error message), and lets the user either retry it
 * once more or discard it outright.
 */
export function DeadLetterRecoveryModal({
  onClose,
  visible
}: DeadLetterRecoveryModalProps) {
  const deadLetterItems = useDeadLetterItems(visible);
  const retryItem = useRetryDeadLetterItem();
  const discardItem = useDiscardSyncItem();
  const [confirmingDiscardId, setConfirmingDiscardId] = useState<string | null>(null);

  const items = deadLetterItems.data ?? [];

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Items needing attention</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>X</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            These edits repeatedly failed to reach the server and have stopped retrying
            automatically. Review why, then retry or discard each one.
          </Text>

          {deadLetterItems.isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loadingIndicator} />
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>Nothing needs attention right now.</Text>
          ) : (
            <ScrollView style={styles.list}>
              {items.map((item) => (
                <DeadLetterRow
                  isConfirmingDiscard={confirmingDiscardId === item.id}
                  isDiscarding={discardItem.isPending && discardItem.variables === item.id}
                  isRetrying={retryItem.isPending && retryItem.variables === item.id}
                  item={item}
                  key={item.id}
                  onCancelDiscard={() => setConfirmingDiscardId(null)}
                  onConfirmDiscard={() => {
                    discardItem.mutate(item.id);
                    setConfirmingDiscardId(null);
                  }}
                  onRequestDiscard={() => setConfirmingDiscardId(item.id)}
                  onRetry={() => retryItem.mutate(item.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function DeadLetterRow({
  isConfirmingDiscard,
  isDiscarding,
  isRetrying,
  item,
  onCancelDiscard,
  onConfirmDiscard,
  onRequestDiscard,
  onRetry
}: {
  isConfirmingDiscard: boolean;
  isDiscarding: boolean;
  isRetrying: boolean;
  item: SyncQueueItem;
  onCancelDiscard: () => void;
  onConfirmDiscard: () => void;
  onRequestDiscard: () => void;
  onRetry: () => void;
}) {
  const entityLabel = ENTITY_LABELS[item.entityType] ?? item.entityType;
  const operationLabel = OPERATION_LABELS[item.operation] ?? item.operation;

  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>
        {entityLabel} {operationLabel}
      </Text>
      <Text style={styles.rowMeta}>Last attempted {formatRelativeTime(item.updatedAt)}</Text>
      {item.lastError ? <Text style={styles.rowError}>{item.lastError}</Text> : null}

      {isConfirmingDiscard ? (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmText}>Discard this edit permanently?</Text>
          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancelDiscard}
              style={[styles.actionButton, styles.secondaryButton]}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isDiscarding}
              onPress={onConfirmDiscard}
              style={[styles.actionButton, styles.dangerButton]}
            >
              <Text style={styles.dangerButtonText}>
                {isDiscarding ? "Discarding…" : "Yes, discard"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isRetrying}
            onPress={onRetry}
            style={[styles.actionButton, styles.primaryButton]}
          >
            <Text style={styles.primaryButtonText}>
              {isRetrying ? "Retrying…" : "Retry"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onRequestDiscard}
            style={[styles.actionButton, styles.secondaryButton]}
          >
            <Text style={styles.secondaryButtonText}>Discard</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(16, 42, 67, 0.5)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    maxHeight: "80%",
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
    fontSize: typography.metric,
    fontWeight: "700"
  },
  closeButton: {
    padding: spacing.xs
  },
  closeText: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: "600"
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.caption,
    marginTop: spacing.xs
  },
  loadingIndicator: {
    marginVertical: spacing.lg
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.body,
    marginVertical: spacing.lg,
    textAlign: "center"
  },
  list: {
    marginTop: spacing.md
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.md
  },
  rowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600"
  },
  rowMeta: {
    color: colors.muted,
    fontSize: typography.caption,
    marginTop: 2
  },
  rowError: {
    color: colors.danger,
    fontSize: typography.caption,
    marginTop: spacing.xs
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  actionButton: {
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  primaryButton: {
    backgroundColor: colors.primary
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "600"
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "600"
  },
  dangerButton: {
    backgroundColor: colors.danger
  },
  dangerButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "600"
  },
  confirmRow: {
    marginTop: spacing.sm
  },
  confirmText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "600"
  }
});
