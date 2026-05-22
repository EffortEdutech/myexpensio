import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import type {
  ClaimDraft,
  ClaimItemDraft,
  ClaimItemType
} from "@/features/claims/types";
import { colors, spacing, typography } from "@/theme/tokens";

const itemTypes: ClaimItemType[] = [
  "parking",
  "toll",
  "grab",
  "taxi",
  "train",
  "flight",
  "meal",
  "lodging",
  "mileage",
  "other"
];

type ClaimDetailProps = {
  claim: ClaimDraft | null | undefined;
  isLoading: boolean;
  items: ClaimItemDraft[];
  onAddItem: (input: {
    amountCents: number;
    itemDate: string;
    notes: string | null;
    title: string;
    type: ClaimItemType;
  }) => void;
  onAttachReceipt: (item: ClaimItemDraft) => void;
  onBack: () => void;
  onDeleteItem: (item: ClaimItemDraft) => void;
  onSubmitClaim: (claim: ClaimDraft) => void;
  onUpdateClaim: (input: {
    periodEnd: string | null;
    periodStart: string | null;
    title: string | null;
  }) => void;
  onUpdateItem: (
    item: ClaimItemDraft,
    input: {
      amountCents: number;
      itemDate: string;
      notes: string | null;
      title: string;
      type: ClaimItemType;
    }
  ) => void;
};

export function ClaimDetail({
  claim,
  isLoading,
  items,
  onAddItem,
  onAttachReceipt,
  onBack,
  onDeleteItem,
  onSubmitClaim,
  onUpdateClaim,
  onUpdateItem
}: ClaimDetailProps) {
  const [title, setTitle] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("Parking");
  const [newItemAmount, setNewItemAmount] = useState("4.50");
  const [newItemDate, setNewItemDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [newItemType, setNewItemType] = useState<ClaimItemType>("parking");

  useEffect(() => {
    if (claim) {
      setTitle(claim.title ?? "");
      setPeriodStart(claim.periodStart ?? "");
      setPeriodEnd(claim.periodEnd ?? "");
    }
  }, [claim]);

  const isDraft = claim?.status === "draft";
  const total = useMemo(
    () => `${((claim?.totalAmountCents ?? 0) / 100).toFixed(2)} ${claim?.currency ?? "MYR"}`,
    [claim?.currency, claim?.totalAmountCents]
  );

  if (isLoading) {
    return (
      <View style={styles.panel}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!claim) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Claim not found</Text>
        <ActionButton label="Back" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={styles.detail}>
      <View style={styles.header}>
        <ActionButton label="Back" onPress={onBack} />
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Claim detail</Text>
          <Text style={styles.title}>{claim.title ?? "Draft claim"}</Text>
          <Text style={styles.meta}>
            {claim.status} - {claim.syncStatus} - {total}
          </Text>
        </View>
      </View>

      {!isDraft ? (
        <View style={styles.lockBanner}>
          <Text style={styles.lockText}>
            Submitted claims are locked locally. Server updates will win during
            sync.
          </Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Claim fields</Text>
        <Field label="Title" value={title} onChangeText={setTitle} disabled={!isDraft} />
        <View style={styles.row}>
          <Field
            label="Start"
            value={periodStart}
            onChangeText={setPeriodStart}
            disabled={!isDraft}
          />
          <Field
            label="End"
            value={periodEnd}
            onChangeText={setPeriodEnd}
            disabled={!isDraft}
          />
        </View>
        <ActionButton
          disabled={!isDraft}
          label="Save claim"
          onPress={() =>
            onUpdateClaim({
              periodEnd: periodEnd.trim() || null,
              periodStart: periodStart.trim() || null,
              title: title.trim() || null
            })
          }
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Add item</Text>
        <Field
          label="Item title"
          value={newItemTitle}
          onChangeText={setNewItemTitle}
          disabled={!isDraft}
        />
        <View style={styles.row}>
          <Field
            label="Amount"
            value={newItemAmount}
            onChangeText={setNewItemAmount}
            disabled={!isDraft}
          />
          <Field
            label="Date"
            value={newItemDate}
            onChangeText={setNewItemDate}
            disabled={!isDraft}
          />
        </View>
        <View style={styles.typeGrid}>
          {itemTypes.map((type) => (
            <Pressable
              accessibilityRole="button"
              disabled={!isDraft}
              key={type}
              onPress={() => setNewItemType(type)}
              style={[
                styles.typeChip,
                newItemType === type ? styles.typeChipActive : null,
                !isDraft ? styles.disabled : null
              ]}
            >
              <Text
                style={[
                  styles.typeChipText,
                  newItemType === type ? styles.typeChipTextActive : null
                ]}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
        <ActionButton
          disabled={!isDraft}
          label="Add item"
          onPress={() =>
            onAddItem({
              amountCents: moneyToCents(newItemAmount),
              itemDate: newItemDate,
              notes: null,
              title: newItemTitle.trim() || "Claim item",
              type: newItemType
            })
          }
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Items</Text>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No claim items yet.</Text>
        ) : (
          items.map((item) => (
            <ClaimItemEditor
              disabled={!isDraft}
              item={item}
              key={item.id}
              onAttachReceipt={() => onAttachReceipt(item)}
              onDelete={() =>
                confirmAction(
                  "Delete item?",
                  "This soft-deletes the item locally.",
                  () => onDeleteItem(item)
                )
              }
              onSave={(input) => onUpdateItem(item, input)}
            />
          ))
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Submit</Text>
        <Text style={styles.emptyText}>
          Submit locks the local draft and queues the status change for backend
          sync.
        </Text>
        <ActionButton
          danger
          disabled={!isDraft}
          label="Submit claim"
          onPress={() =>
            confirmAction(
              "Submit claim?",
              "Submitted claims cannot be edited locally.",
              () => onSubmitClaim(claim)
            )
          }
        />
      </View>
    </View>
  );
}

function ClaimItemEditor({
  disabled,
  item,
  onAttachReceipt,
  onDelete,
  onSave
}: {
  disabled: boolean;
  item: ClaimItemDraft;
  onAttachReceipt: () => void;
  onDelete: () => void;
  onSave: (input: {
    amountCents: number;
    itemDate: string;
    notes: string | null;
    title: string;
    type: ClaimItemType;
  }) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [amount, setAmount] = useState((item.amountCents / 100).toFixed(2));
  const [itemDate, setItemDate] = useState(item.itemDate);
  const [type, setType] = useState<ClaimItemType>(item.type);

  useEffect(() => {
    setTitle(item.title);
    setAmount((item.amountCents / 100).toFixed(2));
    setItemDate(item.itemDate);
    setType(item.type);
  }, [item.amountCents, item.itemDate, item.title, item.type]);

  return (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>
        {(item.amountCents / 100).toFixed(2)} {item.currency} - {item.syncStatus}
      </Text>
      <Field label="Title" value={title} onChangeText={setTitle} disabled={disabled} />
      <View style={styles.row}>
        <Field label="Amount" value={amount} onChangeText={setAmount} disabled={disabled} />
        <Field label="Date" value={itemDate} onChangeText={setItemDate} disabled={disabled} />
      </View>
      <View style={styles.typeGrid}>
        {itemTypes.map((itemType) => (
          <Pressable
            accessibilityRole="button"
            disabled={disabled}
            key={itemType}
            onPress={() => setType(itemType)}
            style={[
              styles.typeChip,
              type === itemType ? styles.typeChipActive : null,
              disabled ? styles.disabled : null
            ]}
          >
            <Text
              style={[
                styles.typeChipText,
                type === itemType ? styles.typeChipTextActive : null
              ]}
            >
              {itemType}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.emptyText}>
        Receipt: {item.receiptId ? "metadata attached" : "none"}
      </Text>
      <View style={styles.actions}>
        <ActionButton
          disabled={disabled}
          label="Save item"
          onPress={() =>
            onSave({
              amountCents: moneyToCents(amount),
              itemDate,
              notes: item.notes,
              title: title.trim() || "Claim item",
              type
            })
          }
        />
        <ActionButton
          disabled={disabled}
          label="Attach receipt"
          onPress={onAttachReceipt}
        />
        <ActionButton danger disabled={disabled} label="Delete" onPress={onDelete} />
      </View>
    </View>
  );
}

function confirmAction(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    const confirmDialog = (globalThis as typeof globalThis & {
      confirm?: (message?: string) => boolean;
    }).confirm;

    if (!confirmDialog || confirmDialog(`${title}\n\n${message}`)) {
      onConfirm();
    }

    return;
  }

  Alert.alert(title, message, [
    { style: "cancel", text: "Cancel" },
    { onPress: onConfirm, style: "destructive", text: "Continue" }
  ]);
}

function Field({
  disabled,
  label,
  onChangeText,
  value
}: {
  disabled?: boolean;
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        editable={!disabled}
        onChangeText={onChangeText}
        style={[styles.input, disabled ? styles.inputDisabled : null]}
        value={value}
      />
    </View>
  );
}

function ActionButton({
  danger,
  disabled,
  label,
  onPress
}: {
  danger?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        danger ? styles.actionButtonDanger : null,
        disabled ? styles.disabled : null,
        pressed ? styles.pressed : null
      ]}
    >
      <Text style={[styles.actionText, danger ? styles.actionTextDanger : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function moneyToCents(value: string) {
  const amount = Number.parseFloat(value.replace(/[^\d.-]/g, ""));

  if (Number.isNaN(amount)) {
    return 0;
  }

  return Math.round(amount * 100);
}

const styles = StyleSheet.create({
  detail: {
    gap: spacing.md
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md
  },
  headerText: {
    flex: 1,
    gap: spacing.xs
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800"
  },
  meta: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  lockBanner: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  lockText: {
    color: "#9a3412",
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  row: {
    flexDirection: "row",
    gap: spacing.md
  },
  field: {
    flex: 1,
    gap: spacing.xs
  },
  label: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 44,
    paddingHorizontal: spacing.sm
  },
  inputDisabled: {
    opacity: 0.58
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  typeChip: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  typeChipActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac"
  },
  typeChipText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  typeChipTextActive: {
    color: "#166534"
  },
  itemCard: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  emptyText: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionButton: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  actionButtonDanger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca"
  },
  actionText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  actionTextDanger: {
    color: colors.danger
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.72
  }
});
