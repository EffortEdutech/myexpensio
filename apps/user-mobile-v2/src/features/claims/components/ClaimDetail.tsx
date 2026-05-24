import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { DatePickerField } from "@/components/DatePickerField";
import type {
  ClaimDraft,
  ClaimItemDraft,
  ClaimItemType
} from "@/features/claims/types";
import type { LocalReceiptFile } from "@/features/receipts/types";
import { colors, spacing, typography } from "@/theme/tokens";

type ClaimDetailProps = {
  claim: ClaimDraft | null | undefined;
  isLoading: boolean;
  items: ClaimItemDraft[];
  onAddItem: (input: {
    amountCents: number;
    itemDate: string;
    notes: string | null;
    receipt?: LocalReceiptFile | null;
    title: string;
    type: ClaimItemType;
  }) => void;
  onAttachReceipt: (item: ClaimItemDraft, receipt: LocalReceiptFile) => void;
  onBack: () => void;
  onDeleteClaim: () => void;
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
      receipt?: LocalReceiptFile | null;
      receiptId?: string | null;
      title: string;
      type: ClaimItemType;
    }
  ) => void;
};

const claimActions: Array<{
  icon: string;
  label: string;
  modal: ClaimModalKind;
}> = [
  { icon: "🚗", label: "Mileage", modal: "mileage" },
  { icon: "🛣️", label: "Toll", modal: "toll" },
  { icon: "🅿️", label: "Parking", modal: "parking" },
  { icon: "🚕", label: "Transport", modal: "transport" },
  { icon: "🍽", label: "Meal", modal: "meal" },
  { icon: "🏨", label: "Lodging", modal: "lodging" },
  { icon: "🧾", label: "Per Diem", modal: "per_diem" },
  { icon: "📦", label: "Misc", modal: "other" }
];

type ClaimModalKind =
  | "mileage"
  | "toll"
  | "parking"
  | "transport"
  | "meal"
  | "lodging"
  | "per_diem"
  | "other";

const transportTypes: Array<{
  icon: string;
  label: string;
  type: ClaimItemType;
}> = [
  { icon: "🟢", label: "Grab", type: "grab" },
  { icon: "🚕", label: "Taxi", type: "taxi" },
  { icon: "🚂", label: "Train", type: "train" },
  { icon: "🚌", label: "Bus", type: "bus" },
  { icon: "✈️", label: "Flight", type: "flight" }
];

export function ClaimDetail({
  claim,
  isLoading,
  items,
  onAddItem,
  onAttachReceipt,
  onBack,
  onDeleteClaim,
  onDeleteItem,
  onSubmitClaim,
  onUpdateClaim,
  onUpdateItem
}: ClaimDetailProps) {
  const [activeModal, setActiveModal] = useState<ClaimModalKind | null>(null);
  const [editingClaim, setEditingClaim] = useState(false);
  const [editingItem, setEditingItem] = useState<ClaimItemDraft | null>(null);
  const [editTitle, setEditTitle] = useState(claim?.title ?? "");
  const [editPeriodStart, setEditPeriodStart] = useState(
    claim?.periodStart ?? todayInput()
  );
  const [editPeriodEnd, setEditPeriodEnd] = useState(
    claim?.periodEnd ?? claim?.periodStart ?? todayInput()
  );
  const isDraft = claim?.status === "draft";
  const totalAmountCents = useMemo(
    () => items.reduce((sum, item) => sum + item.amountCents, 0),
    [items]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingPanel}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!claim) {
    return (
      <View style={styles.loadingPanel}>
        <Text style={styles.pageTitle}>Claim not found</Text>
        <SmallButton label="Back" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={onBack}>
          <Text style={styles.backText}>← Claims</Text>
        </Pressable>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>
            {claim.title || periodLabel(claim.periodStart, claim.periodEnd)}
          </Text>
          <Text style={styles.pageSub}>
            {periodLabel(claim.periodStart, claim.periodEnd)}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{isDraft ? "Draft" : "Submitted"}</Text>
        </View>
      </View>

      {isDraft ? (
        <View style={styles.editPanel}>
          {editingClaim ? (
            <>
              <Field
                label="Claim Title"
                onChangeText={setEditTitle}
                value={editTitle}
              />
              <View style={styles.fieldRow}>
                <DatePickerField
                  label="Start"
                  onChange={setEditPeriodStart}
                  value={editPeriodStart}
                />
                <DatePickerField
                  label="End"
                  onChange={setEditPeriodEnd}
                  value={editPeriodEnd}
                />
              </View>
              <View style={styles.editActionRow}>
                <SmallButton label="Cancel" onPress={() => setEditingClaim(false)} />
                <SmallButton
                  label="Save Claim"
                  onPress={() => {
                    onUpdateClaim({
                      periodEnd: editPeriodEnd,
                      periodStart: editPeriodStart,
                      title: editTitle.trim() || null
                    });
                    setEditingClaim(false);
                  }}
                />
              </View>
            </>
          ) : (
            <SmallButton
              label="Edit Claim"
              onPress={() => {
                setEditTitle(claim.title ?? "");
                setEditPeriodStart(claim.periodStart ?? todayInput());
                setEditPeriodEnd(
                  claim.periodEnd ?? claim.periodStart ?? todayInput()
                );
                setEditingClaim(true);
              }}
            />
          )}
        </View>
      ) : (
        <View style={styles.lockedPanel}>
          <Text style={styles.lockedText}>
            Submitted claims are read-only. Create a new draft for changes.
          </Text>
        </View>
      )}

      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Items ({items.length})</Text>
        {items.length === 0 ? (
          <View style={styles.emptyItems}>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyCopy}>
              Add mileage, toll, parking, transport, meal, lodging, per diem, or
              misc.
            </Text>
          </View>
        ) : (
          <View style={styles.itemList}>
            {items.map((item) => (
              <ClaimItemRow
                disabled={!isDraft}
                item={item}
                key={item.id}
                onAttachReceipt={(receipt) => onAttachReceipt(item, receipt)}
                onEdit={() => setEditingItem(item)}
                onDelete={() =>
                  confirmAction("Delete item?", "Remove this item from the claim.", () =>
                    onDeleteItem(item)
                  )
                }
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatMoney(totalAmountCents, claim.currency)}</Text>
      </View>

      {isDraft ? (
        <View style={styles.actionGrid}>
          {claimActions.map((action) => (
            <Pressable
              accessibilityRole="button"
              key={action.modal}
              onPress={() => setActiveModal(action.modal)}
              style={({ pressed }) => [
                styles.claimAction,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.claimActionIcon}>{action.icon}</Text>
              <Text style={styles.claimActionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={!isDraft || items.length === 0}
        onPress={() =>
          confirmAction(
            "Submit claim?",
            "Submitted claims cannot be edited locally.",
            () => onSubmitClaim(claim)
          )
        }
        style={({ pressed }) => [
          styles.submitButton,
          !isDraft || items.length === 0 ? styles.disabled : null,
          pressed ? styles.pressed : null
        ]}
      >
        <Text style={styles.submitButtonText}>✓ Submit Claim</Text>
      </Pressable>

      {isDraft ? (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            confirmAction(
              "Delete claim?",
              "Delete this claim and all its items?",
              onDeleteClaim
            )
          }
          style={({ pressed }) => [
            styles.deleteClaimButton,
            pressed ? styles.pressed : null
          ]}
        >
          <Text style={styles.deleteClaimText}>🗑 Delete Claim</Text>
        </Pressable>
      ) : null}

      <AddClaimItemModal
        kind={activeModal}
        onAddItem={onAddItem}
        onClose={() => setActiveModal(null)}
      />

      <EditClaimItemModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onUpdateItem={(item, input) => {
          onUpdateItem(item, input);
          setEditingItem(null);
        }}
      />
    </View>
  );
}

function ClaimItemRow({
  disabled,
  item,
  onAttachReceipt,
  onEdit,
  onDelete
}: {
  disabled: boolean;
  item: ClaimItemDraft;
  onAttachReceipt: (receipt: LocalReceiptFile) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = getItemMeta(item.type);

  return (
    <View style={styles.itemRow}>
      <View style={styles.itemDateCol}>
        <Text style={styles.itemDate}>{formatDate(item.itemDate)}</Text>
      </View>
      <Text style={styles.itemIcon}>{meta.icon}</Text>
      <View style={styles.itemBody}>
        <Text style={styles.itemType}>{meta.label}</Text>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={item.receiptId ? styles.receiptStatusAttached : styles.receiptStatusMissing}>
          {item.receiptId ? "Receipt attached" : "No receipt"}
        </Text>
      </View>
      <View style={styles.itemAmountCol}>
        <Text style={styles.itemAmount}>
          {formatMoney(item.amountCents, item.currency)}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={() =>
            void openLocalReceiptPicker("gallery").then((receipt) => {
              if (receipt) {
                onAttachReceipt(receipt);
              }
            })
          }
          style={styles.receiptChipButton}
        >
          <Text style={styles.receiptChipText}>
            {item.receiptId ? "Replace" : "Receipt"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onEdit}
          style={styles.editItemButton}
        >
          <Text style={styles.editItemText}>Edit</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onDelete}
          style={styles.deleteItemButton}
        >
          <Text style={styles.deleteItemText}>×</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AddClaimItemModal({
  kind,
  onAddItem,
  onClose
}: {
  kind: ClaimModalKind | null;
  onAddItem: (input: {
    amountCents: number;
    itemDate: string;
    notes: string | null;
    receipt?: LocalReceiptFile | null;
    title: string;
    type: ClaimItemType;
  }) => void;
  onClose: () => void;
}) {
  const [transportType, setTransportType] = useState<ClaimItemType>("grab");
  const [date, setDate] = useState(todayInput());
  const [amount, setAmount] = useState("0.00");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [paidViaTng, setPaidViaTng] = useState(false);
  const [receipt, setReceipt] = useState<LocalReceiptFile | null>(null);

  if (!kind) {
    return null;
  }

  const meta = getModalMeta(kind, transportType);

  function handleAdd() {
    onAddItem({
      amountCents: moneyToCents(amount),
      itemDate: date,
      notes: notes.trim() || null,
      receipt,
      title: description.trim() || meta.defaultTitle,
      type: meta.type
    });
    setAmount("0.00");
    setDescription("");
    setNotes("");
    setPaidViaTng(false);
    setReceipt(null);
    onClose();
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add {meta.title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {kind === "transport" ? (
              <View style={styles.field}>
                <Text style={styles.label}>Transport Type</Text>
                <View style={styles.transportGrid}>
                  {transportTypes.map((transport) => (
                    <Pressable
                      accessibilityRole="button"
                      key={transport.label}
                      onPress={() => setTransportType(transport.type)}
                      style={[
                        styles.transportOption,
                        transportType === transport.type
                          ? styles.transportOptionActive
                          : null
                      ]}
                    >
                      <Text style={styles.transportIcon}>{transport.icon}</Text>
                      <Text style={styles.transportLabel}>{transport.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {kind === "transport" || kind === "toll" || kind === "parking" ? (
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: paidViaTng }}
                onPress={() => setPaidViaTng((value) => !value)}
                style={styles.tngToggle}
              >
                <View style={[styles.switchTrack, paidViaTng ? styles.switchOn : null]}>
                  <View style={[styles.switchThumb, paidViaTng ? styles.switchThumbOn : null]} />
                </View>
                <View style={styles.tngTextWrap}>
                  <Text style={styles.tngTitle}>Paid via TNG (Touch 'n Go)</Text>
                  <Text style={styles.tngSub}>
                    Toggle ON if this was charged to your TNG card
                  </Text>
                </View>
              </Pressable>
            ) : null}

            <DatePickerField label="Date *" value={date} onChange={setDate} />
            <Field
              label="Amount (MYR) *"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <Field
              label={meta.descriptionLabel}
              value={description}
              onChangeText={setDescription}
            />
            <Field label="Notes (optional)" value={notes} onChangeText={setNotes} />

            <View style={styles.field}>
              <Text style={styles.label}>Receipt (optional)</Text>
              <ReceiptCaptureField onChange={setReceipt} value={receipt} />
              <ReceiptChoice
                icon="📷"
                title="Scan Document"
                sub="Camera · auto edge detect · perspective fix"
              />
              <ReceiptChoice
                icon="📎"
                title="Attach from Gallery"
                sub="JPEG · PNG · WebP · Max 5 MB"
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              accessibilityRole="button"
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.modalAddButton,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.modalAddText}>Add {meta.buttonLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditClaimItemModal({
  item,
  onClose,
  onUpdateItem
}: {
  item: ClaimItemDraft | null;
  onClose: () => void;
  onUpdateItem: (
    item: ClaimItemDraft,
    input: {
      amountCents: number;
      itemDate: string;
      notes: string | null;
      receipt?: LocalReceiptFile | null;
      receiptId?: string | null;
      title: string;
      type: ClaimItemType;
    }
  ) => void;
}) {
  const [date, setDate] = useState(todayInput());
  const [amount, setAmount] = useState("0.00");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<LocalReceiptFile | null>(null);

  useMemo(() => {
    if (!item) {
      return;
    }

    setDate(item.itemDate);
    setAmount((item.amountCents / 100).toFixed(2));
    setTitle(item.title);
    setNotes(item.notes ?? "");
    setReceipt(null);
  }, [item?.id]);

  if (!item) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <DatePickerField label="Date" onChange={setDate} value={date} />
            <Field
              keyboardType="decimal-pad"
              label="Amount (MYR)"
              onChangeText={setAmount}
              value={amount}
            />
            <Field label="Description" onChangeText={setTitle} value={title} />
            <Field label="Notes" onChangeText={setNotes} value={notes} />
            <View style={styles.field}>
              <Text style={styles.label}>Receipt</Text>
              {item.receiptId && !receipt ? (
                <View style={styles.receiptAttached}>
                  <Text style={styles.receiptAttachedText}>
                    Receipt attached locally
                  </Text>
                  <Text style={styles.receiptAttachedSub}>
                    Replace it below or remove it before saving.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setReceipt({
                        fileSize: null,
                        localUri: "",
                        mimeType: null,
                        name: "Remove receipt",
                        source: "gallery"
                      })
                    }
                    style={styles.receiptRemoveButton}
                  >
                    <Text style={styles.receiptRemoveText}>Remove Receipt</Text>
                  </Pressable>
                </View>
              ) : null}
              <ReceiptCaptureField
                onChange={setReceipt}
                value={receipt?.localUri === "" ? null : receipt}
              />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                onUpdateItem(item, {
                  amountCents: moneyToCents(amount),
                  itemDate: date,
                  notes: notes.trim() || null,
                  receipt: receipt?.localUri ? receipt : null,
                  receiptId: receipt?.localUri === "" ? null : item.receiptId,
                  title: title.trim() || getItemMeta(item.type).label,
                  type: item.type
                })
              }
              style={styles.modalAddButton}
            >
              <Text style={styles.modalAddText}>Save Item</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReceiptChoice({
  icon,
  onPress,
  selected,
  sub,
  title
}: {
  icon: string;
  onPress?: () => void;
  selected?: boolean;
  sub: string;
  title: string;
}) {
  if (!onPress) {
    return null;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.receiptChoice, selected ? styles.receiptChoiceSelected : null]}
    >
      <Text style={styles.receiptIcon}>{icon}</Text>
      <View style={styles.receiptBody}>
        <Text style={styles.receiptTitle}>{title}</Text>
        <Text style={styles.receiptSub}>{sub}</Text>
      </View>
      <Text style={styles.receiptArrow}>›</Text>
    </Pressable>
  );
}

function ReceiptCaptureField({
  onChange,
  value
}: {
  onChange: (receipt: LocalReceiptFile | null) => void;
  value: LocalReceiptFile | null;
}) {
  return (
    <View style={styles.receiptCapture}>
      <ReceiptChoice
        icon="Camera"
        onPress={() =>
          void openLocalReceiptPicker("camera").then((receipt) => {
            if (receipt) {
              onChange(receipt);
            }
          })
        }
        selected={value?.source === "camera"}
        sub="Camera - auto edge detect - perspective fix"
        title="Scan Document"
      />
      <ReceiptChoice
        icon="Attach"
        onPress={() =>
          void openLocalReceiptPicker("gallery").then((receipt) => {
            if (receipt) {
              onChange(receipt);
            }
          })
        }
        selected={value?.source === "gallery"}
        sub="JPEG - PNG - WebP - Max 5 MB"
        title="Attach from Gallery"
      />
      {value ? (
        <View style={styles.receiptPreview}>
          <View style={styles.receiptPreviewBody}>
            <Text style={styles.receiptPreviewTitle}>{value.name}</Text>
            <Text style={styles.receiptPreviewSub}>
              {value.mimeType ?? "image"} - {formatFileSize(value.fileSize)} - pending sync
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange(null)}
            style={styles.receiptRemoveButton}
          >
            <Text style={styles.receiptRemoveText}>Remove</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Field({
  keyboardType,
  label,
  onChangeText,
  value
}: {
  keyboardType?: "default" | "decimal-pad";
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType ?? "default"}
        onChangeText={onChangeText}
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.smallButton}>
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

function getModalMeta(kind: ClaimModalKind, transportType: ClaimItemType) {
  if (kind === "transport") {
    const transport = transportTypes.find((item) => item.type === transportType);
    return {
      buttonLabel: transport?.label ?? "Transport",
      defaultTitle: transport?.label ?? "Transport",
      descriptionLabel: "Route / Description (optional)",
      title: "Transport",
      type: transportType
    };
  }

  const meta = getItemMeta(kind);

  return {
    buttonLabel: meta.label,
    defaultTitle: meta.label,
    descriptionLabel:
      kind === "mileage"
        ? "Route / Description (optional)"
        : "Description (optional)",
    title: meta.label,
    type: kind as ClaimItemType
  };
}

function getItemMeta(type: ClaimItemType | ClaimModalKind) {
  const labels: Record<string, { icon: string; label: string }> = {
    flight: { icon: "✈️", label: "Flight" },
    bus: { icon: "🚌", label: "Bus" },
    grab: { icon: "🟢", label: "Grab" },
    lodging: { icon: "🏨", label: "Lodging" },
    meal: { icon: "🍽", label: "Meal" },
    mileage: { icon: "🚗", label: "Mileage" },
    other: { icon: "📦", label: "Misc" },
    parking: { icon: "🅿️", label: "Parking" },
    per_diem: { icon: "🧾", label: "Per Diem" },
    taxi: { icon: "🚕", label: "Taxi" },
    toll: { icon: "🛣️", label: "TOLL" },
    train: { icon: "🚂", label: "Train" }
  };

  return labels[type] ?? labels.other;
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

function periodLabel(start: string | null, end: string | null): string {
  if (!start && !end) {
    return "-";
  }

  if (start && end) {
    if (start === end) {
      return formatDate(start);
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  return formatDate(start ?? end);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatMoney(amountCents: number, currency: string) {
  return `${currency} ${(amountCents / 100).toFixed(2)}`;
}

function moneyToCents(value: string) {
  const amount = Number.parseFloat(value.replace(/[^\d.-]/g, ""));

  if (Number.isNaN(amount)) {
    return 0;
  }

  return Math.round(amount * 100);
}

async function openLocalReceiptPicker(
  source: LocalReceiptFile["source"]
): Promise<LocalReceiptFile | null> {
  if (Platform.OS !== "web") {
    return {
      fileSize: null,
      localUri: `local://${source}/receipt/${Date.now()}.jpg`,
      mimeType: "image/jpeg",
      name: source === "camera" ? "Camera receipt" : "Gallery receipt",
      source
    };
  }

  const documentRef = (globalThis as typeof globalThis & {
    document?: Document;
    URL?: typeof URL;
  }).document;

  if (!documentRef) {
    return null;
  }

  return new Promise((resolve) => {
    const input = documentRef.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/webp";
    if (source === "camera") {
      input.setAttribute("capture", "environment");
    }
    input.style.display = "none";
    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      input.remove();

      if (!file) {
        resolve(null);
        return;
      }

      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        resolve(null);
        return;
      }

      if (file.size > 5_242_880) {
        resolve(null);
        return;
      }

      resolve({
        fileSize: file.size,
        localUri: URL.createObjectURL(file),
        mimeType: file.type,
        name: file.name || `${source}-receipt.jpg`,
        source
      });
    };
    documentRef.body.appendChild(input);
    input.click();
  });
}

function formatFileSize(fileSize: number | null) {
  if (!fileSize) {
    return "local file";
  }

  if (fileSize < 1024 * 1024) {
    return `${Math.max(1, Math.round(fileSize / 1024))} KB`;
  }

  return `${(fileSize / 1024 / 1024).toFixed(1)} MB`;
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md
  },
  loadingPanel: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    justifyContent: "center",
    minHeight: 180,
    padding: spacing.lg
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  backText: {
    color: "#64748b",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  pageTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  pageSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    marginTop: 3
  },
  statusBadge: {
    backgroundColor: "#fef9c3",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  statusText: {
    color: "#854d0e",
    fontSize: 10,
    fontWeight: "900"
  },
  editPanel: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  lockedPanel: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  lockedText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  editActionRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  itemsSection: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  itemList: {
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  itemRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 68,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  itemDateCol: {
    width: 84
  },
  itemDate: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16
  },
  itemIcon: {
    fontSize: 18,
    width: 24
  },
  itemBody: {
    flex: 1,
    minWidth: 0
  },
  itemType: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  itemTitle: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    marginTop: 2
  },
  receiptStatusAttached: {
    color: "#15803d",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3
  },
  receiptStatusMissing: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3
  },
  itemAmountCol: {
    alignItems: "flex-end",
    gap: 3
  },
  itemAmount: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  editItemButton: {
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    minHeight: 26,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  editItemText: {
    color: "#2563eb",
    fontSize: 10,
    fontWeight: "900"
  },
  receiptChipButton: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 26,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  receiptChipText: {
    color: "#15803d",
    fontSize: 10,
    fontWeight: "900"
  },
  deleteItemButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 26,
    justifyContent: "center",
    width: 26
  },
  deleteItemText: {
    color: colors.danger,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20
  },
  emptyItems: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
    maxWidth: 280,
    textAlign: "center"
  },
  totalRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.md
  },
  totalLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  totalValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  claimAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "48%",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  claimActionIcon: {
    fontSize: 18,
    width: 24
  },
  claimActionText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: "center"
  },
  submitButtonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "900"
  },
  deleteClaimButton: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center"
  },
  deleteClaimText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: "900"
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: "92%",
    maxWidth: 480,
    overflow: "hidden",
    width: "100%"
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  modalClose: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "800"
  },
  modalBody: {
    gap: spacing.md,
    padding: spacing.lg
  },
  field: {
    gap: 6
  },
  label: {
    color: "#374151",
    fontSize: typography.caption,
    fontWeight: "800"
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  transportGrid: {
    gap: spacing.sm
  },
  transportOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  transportOptionActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd"
  },
  transportIcon: {
    fontSize: 18,
    width: 24
  },
  transportLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  tngToggle: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  switchTrack: {
    backgroundColor: "#cbd5e1",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    padding: 2,
    width: 44
  },
  switchOn: {
    backgroundColor: "#22c55e"
  },
  switchThumb: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    height: 20,
    width: 20
  },
  switchThumbOn: {
    marginLeft: 20
  },
  tngTextWrap: {
    flex: 1,
    gap: 2
  },
  tngTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  tngSub: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16
  },
  receiptChoice: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  receiptChoiceSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#22c55e"
  },
  receiptCapture: {
    gap: spacing.sm
  },
  receiptIcon: {
    fontSize: 20,
    width: 24
  },
  receiptBody: {
    flex: 1
  },
  receiptTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  receiptSub: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2
  },
  receiptArrow: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "800"
  },
  receiptAttached: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md
  },
  receiptAttachedText: {
    color: "#15803d",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  receiptAttachedSub: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16
  },
  receiptPreview: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  receiptPreviewBody: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  receiptPreviewTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  receiptPreviewSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  receiptRemoveButton: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  receiptRemoveText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: "900"
  },
  modalFooter: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    padding: spacing.lg
  },
  modalAddButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: "center"
  },
  modalAddText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "900"
  },
  smallButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  smallButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.75
  }
});
