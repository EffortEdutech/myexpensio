import { useEffect, useMemo, useState } from "react";
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
import { useReceiptDraft } from "@/features/receipts/hooks/useReceiptUploadSummary";
import type { LocalReceiptFile, ReceiptDraft } from "@/features/receipts/types";
import { matchTngToClaimItems, scorePair } from "@/features/tng/matcher";
import type { TngTransaction } from "@/features/tng/types";
import type { TripDraft } from "@/features/trips/types";
import type { ClaimRates } from "@/state/settingsStore";
import { colors, spacing, typography } from "@/theme/tokens";

type ClaimDetailProps = {
  claim: ClaimDraft | null | undefined;
  isLoading: boolean;
  items: ClaimItemDraft[];
  onAddItem: (input: {
    amountCents: number;
    itemDate: string;
    mode?: string | null;
    notes: string | null;
    receipt?: LocalReceiptFile | null;
    tngTransactionId?: string | null;
    tripId?: string | null;
    title: string;
    type: ClaimItemType;
  }) => void;
  rates: ClaimRates;
  onAttachReceipt: (item: ClaimItemDraft, receipt: LocalReceiptFile) => void;
  onBack: () => void;
  onDeleteClaim: () => void;
  onDeleteItem: (item: ClaimItemDraft) => void;
  onLinkTngTransaction: (
    item: ClaimItemDraft,
    transaction: TngTransaction
  ) => void;
  onRemoveReceipt: (item: ClaimItemDraft) => void;
  onSubmitClaim: (claim: ClaimDraft) => void;
  onUnlinkTngTransaction: (item: ClaimItemDraft) => void;
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
      mode?: string | null;
      notes: string | null;
      receipt?: LocalReceiptFile | null;
      receiptId?: string | null;
      tngTransactionId?: string | null;
      title: string;
      type: ClaimItemType;
    }
  ) => void;
  tngTransactions: TngTransaction[];
  trips: TripDraft[];
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

type MealSession = "MORNING" | "NOON" | "EVENING" | "FULL_DAY";

const mealSessions: Array<{ label: string; type: MealSession }> = [
  { label: "Morning", type: "MORNING" },
  { label: "Noon", type: "NOON" },
  { label: "Evening", type: "EVENING" },
  { label: "Full Day", type: "FULL_DAY" }
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
  onLinkTngTransaction,
  onRemoveReceipt,
  onSubmitClaim,
  onUnlinkTngTransaction,
  onUpdateClaim,
  onUpdateItem,
  rates,
  tngTransactions,
  trips
}: ClaimDetailProps) {
  const [activeModal, setActiveModal] = useState<ClaimModalKind | null>(null);
  const [editingClaim, setEditingClaim] = useState(false);
  const [editingItem, setEditingItem] = useState<ClaimItemDraft | null>(null);
  const [viewingItem, setViewingItem] = useState<ClaimItemDraft | null>(null);
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
  const unresolvedTngItems = useMemo(
    () =>
      items.filter(
        (item) => item.mode === "tng_pending" && !item.tngTransactionId
      ),
    [items]
  );
  const canSubmitClaim =
    Boolean(isDraft) && items.length > 0 && unresolvedTngItems.length === 0;

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
                onLinkTngTransaction={onLinkTngTransaction}
                onRemoveReceipt={() => onRemoveReceipt(item)}
                onOpen={() => setViewingItem(item)}
                onUnlinkTngTransaction={() => onUnlinkTngTransaction(item)}
                onDelete={() =>
                  confirmAction("Delete item?", "Remove this item from the claim.", () =>
                    onDeleteItem(item)
                  )
                }
                tngTransactions={tngTransactions}
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

      {unresolvedTngItems.length > 0 ? (
        <View style={styles.submitNotice}>
          <Text style={styles.submitNoticeTitle}>TNG link pending</Text>
          <Text style={styles.submitNoticeCopy}>
            Link {unresolvedTngItems.length} TNG item(s) before submitting this
            claim.
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={!canSubmitClaim}
        onPress={() => {
          if (!canSubmitClaim) {
            return;
          }

          confirmAction(
            "Submit claim?",
            "Submitted claims cannot be edited locally. Please confirm all items and receipts are correct.",
            () => onSubmitClaim(claim)
          );
        }}
        style={({ pressed }) => [
          styles.submitButton,
          !canSubmitClaim ? styles.disabled : null,
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
        existingItems={items}
        kind={activeModal}
        onAddItem={onAddItem}
        onClose={() => setActiveModal(null)}
        rates={rates}
        trips={trips}
      />

      <EditClaimItemModal
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onUpdateItem={(item, input) => {
          onUpdateItem(item, input);
          setEditingItem(null);
        }}
      />

      <ClaimItemDetailModal
        disabled={!isDraft}
        item={viewingItem}
        onAttachReceipt={(item, receipt) => onAttachReceipt(item, receipt)}
        onClose={() => setViewingItem(null)}
        onDelete={(item) =>
          confirmAction("Delete item?", "Remove this item from the claim.", () => {
            onDeleteItem(item);
            setViewingItem(null);
          })
        }
        onEdit={(item) => {
          setViewingItem(null);
          setEditingItem(item);
        }}
        onLinkTngTransaction={onLinkTngTransaction}
        onRemoveReceipt={(item) => onRemoveReceipt(item)}
        onUnlinkTngTransaction={(item) => onUnlinkTngTransaction(item)}
        tngTransactions={tngTransactions}
      />
    </View>
  );
}

function ClaimItemRow({
  disabled,
  item,
  onAttachReceipt,
  onEdit,
  onLinkTngTransaction,
  onOpen,
  onRemoveReceipt,
  onUnlinkTngTransaction,
  tngTransactions,
  onDelete
}: {
  disabled: boolean;
  item: ClaimItemDraft;
  onAttachReceipt: (receipt: LocalReceiptFile) => void;
  onEdit: () => void;
  onLinkTngTransaction: (
    item: ClaimItemDraft,
    transaction: TngTransaction
  ) => void;
  onOpen: () => void;
  onRemoveReceipt: () => void;
  onUnlinkTngTransaction: () => void;
  tngTransactions: TngTransaction[];
  onDelete: () => void;
}) {
  const meta = getItemMeta(item.type);
  const receipt = useReceiptDraft(item.receiptId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [tngPickerOpen, setTngPickerOpen] = useState(false);
  const linkedTransaction = tngTransactions.find(
    (transaction) => transaction.id === item.tngTransactionId
  );
  const canUseTng = ["toll", "parking", "grab", "taxi", "train", "bus"].includes(
    item.type
  );
  const canEditItem = item.type !== "mileage";
  const isTngPending = item.mode === "tng_pending" || item.mode === "tng_linked";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [
        styles.itemRow,
        pressed ? styles.itemRowPressed : null
      ]}
    >
      <View style={styles.itemDateCol}>
        <Text style={styles.itemDate}>{formatDate(item.itemDate)}</Text>
      </View>
      <Text style={styles.itemIcon}>{meta.icon}</Text>
      <View style={styles.itemBody}>
        <Text style={styles.itemType}>{meta.label}</Text>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {isTngPending ? (
          <Text style={item.tngTransactionId ? styles.tngLinkedText : styles.tngPendingText}>
            {item.tngTransactionId
              ? `TNG linked${linkedTransaction ? ` - ${locationLabel(linkedTransaction)}` : ""}`
              : "TNG pending - link transaction"}
          </Text>
        ) : null}
        <Text style={item.receiptId ? styles.receiptStatusAttached : styles.receiptStatusMissing}>
          {item.receiptId
            ? receipt.data?.uploadStatus === "uploaded"
              ? "Receipt uploaded"
              : "Receipt attached"
            : "No receipt"}
        </Text>
      </View>
      <View style={styles.itemAmountCol}>
        <Text style={styles.itemAmount}>
          {formatMoney(item.amountCents, item.currency)}
        </Text>
        {!disabled ? (
        <Pressable
          accessibilityRole="button"
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
        ) : null}
        {item.receiptId ? (
          <View style={styles.itemMiniActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setViewerOpen(true)}
              style={styles.viewReceiptButton}
            >
              <Text style={styles.viewReceiptText}>View</Text>
            </Pressable>
            {!disabled ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRemoveReceipt}
              style={styles.removeReceiptMiniButton}
            >
              <Text style={styles.removeReceiptMiniText}>Remove</Text>
            </Pressable>
            ) : null}
          </View>
        ) : null}
        {!disabled && canUseTng ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setTngPickerOpen(true)}
            style={item.tngTransactionId ? styles.tngLinkedButton : styles.tngLinkButton}
          >
            <Text style={item.tngTransactionId ? styles.tngLinkedButtonText : styles.tngLinkButtonText}>
              {item.tngTransactionId ? "TNG" : "Link TNG"}
            </Text>
          </Pressable>
        ) : null}
        {!disabled && item.tngTransactionId ? (
        <Pressable
          accessibilityRole="button"
          onPress={onUnlinkTngTransaction}
          style={styles.unlinkTngButton}
        >
          <Text style={styles.unlinkTngText}>Unlink</Text>
        </Pressable>
        ) : null}
        {!disabled ? (
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={styles.editItemButton}
        >
          <Text style={styles.editItemText}>Edit</Text>
        </Pressable>
        ) : null}
        {!disabled ? (
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          style={styles.deleteItemButton}
        >
          <Text style={styles.deleteItemText}>×</Text>
        </Pressable>
        ) : null}
      </View>
      <ReceiptViewerModal
        onClose={() => setViewerOpen(false)}
        receipt={receipt.data ?? null}
        visible={viewerOpen}
      />
      <TngLinkModal
        item={item}
        onClose={() => setTngPickerOpen(false)}
        onLink={(transaction) => {
          onLinkTngTransaction(item, transaction);
          setTngPickerOpen(false);
        }}
        transactions={tngTransactions}
        visible={tngPickerOpen}
      />
    </Pressable>
  );
}

function ClaimItemDetailModal({
  disabled,
  item,
  onAttachReceipt,
  onClose,
  onDelete,
  onEdit,
  onLinkTngTransaction,
  onRemoveReceipt,
  onUnlinkTngTransaction,
  tngTransactions
}: {
  disabled: boolean;
  item: ClaimItemDraft | null;
  onAttachReceipt: (item: ClaimItemDraft, receipt: LocalReceiptFile) => void;
  onClose: () => void;
  onDelete: (item: ClaimItemDraft) => void;
  onEdit: (item: ClaimItemDraft) => void;
  onLinkTngTransaction: (
    item: ClaimItemDraft,
    transaction: TngTransaction
  ) => void;
  onRemoveReceipt: (item: ClaimItemDraft) => void;
  onUnlinkTngTransaction: (item: ClaimItemDraft) => void;
  tngTransactions: TngTransaction[];
}) {
  const [tngPickerOpen, setTngPickerOpen] = useState(false);
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const receipt = useReceiptDraft(item?.receiptId);

  if (!item) {
    return null;
  }

  const meta = getItemMeta(item.type);
  const linkedTransaction = tngTransactions.find(
    (transaction) => transaction.id === item.tngTransactionId
  );
  const canUseTng = ["toll", "parking", "grab", "taxi", "train", "bus"].includes(
    item.type
  );
  const canEditItem = item.type !== "mileage";

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>{meta.label}</Text>
              <Text style={styles.modalSubtitle}>
                {formatDate(item.itemDate)} - {formatMoney(item.amountCents, item.currency)}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.itemDetailHero}>
              <Text style={styles.itemDetailIcon}>{meta.icon}</Text>
              <View style={styles.itemDetailHeroText}>
                <Text style={styles.itemDetailTitle}>{item.title}</Text>
                <Text style={styles.itemDetailSub}>
                  {item.mode === "tng_linked"
                    ? "Paid via linked TNG transaction"
                    : item.mode === "tng_pending"
                      ? "Paid via TNG - transaction link pending"
                      : "Manual claim item"}
                </Text>
              </View>
            </View>

            <View style={styles.detailTable}>
              <DetailLine label="Date" value={formatDate(item.itemDate)} />
              <DetailLine label="Type" value={meta.label} />
              <DetailLine label="Amount" value={formatMoney(item.amountCents, item.currency)} />
              <DetailLine
                label="Receipt"
                value={
                  item.receiptId
                    ? receipt.data?.uploadStatus === "uploaded"
                      ? "Uploaded"
                      : "Attached locally"
                    : "Not attached"
                }
              />
              {linkedTransaction ? (
                <DetailLine
                  label="TNG"
                  value={`${locationLabel(linkedTransaction)} - ${formatMoney(
                    linkedTransaction.amountCents,
                    linkedTransaction.currency
                  )}`}
                />
              ) : item.mode === "tng_pending" ? (
                <DetailLine label="TNG" value="Link pending" />
              ) : null}
              {item.notes ? <DetailLine label="Notes" value={item.notes} /> : null}
            </View>

            {!disabled ? (
              <View style={styles.detailActionGrid}>
                {canEditItem ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onEdit(item)}
                    style={styles.detailPrimaryAction}
                  >
                    <Text style={styles.detailPrimaryText}>Edit Item</Text>
                  </Pressable>
                ) : (
                  <View style={styles.lockedPanel}>
                    <Text style={styles.lockedText}>
                      Mileage amount is calculated from the saved trip. Delete
                      and add the trip again to recalculate.
                    </Text>
                  </View>
                )}
                {item.receiptId ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setReceiptViewerOpen(true)}
                    style={styles.detailSecondaryAction}
                  >
                    <Text style={styles.detailSecondaryText}>View Receipt</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    void openLocalReceiptPicker("gallery").then((picked) => {
                      if (picked) {
                        onAttachReceipt(item, picked);
                      }
                    })
                  }
                  style={styles.detailSecondaryAction}
                >
                  <Text style={styles.detailSecondaryText}>
                    {item.receiptId ? "Replace Receipt" : "Attach Receipt"}
                  </Text>
                </Pressable>
                {item.receiptId ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onRemoveReceipt(item)}
                    style={styles.detailSecondaryAction}
                  >
                    <Text style={styles.detailSecondaryText}>Remove Receipt</Text>
                  </Pressable>
                ) : null}
                {canUseTng ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setTngPickerOpen(true)}
                    style={styles.detailSecondaryAction}
                  >
                    <Text style={styles.detailSecondaryText}>
                      {item.tngTransactionId ? "Change TNG" : "Link TNG"}
                    </Text>
                  </Pressable>
                ) : null}
                {item.tngTransactionId ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onUnlinkTngTransaction(item)}
                    style={styles.detailSecondaryAction}
                  >
                    <Text style={styles.detailSecondaryText}>Unlink TNG</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onDelete(item)}
                  style={styles.detailDangerAction}
                >
                  <Text style={styles.detailDangerText}>Delete Item</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.lockedPanel}>
                <Text style={styles.lockedText}>
                  Submitted claim items are read-only.
                </Text>
              </View>
            )}
          </ScrollView>

          <TngLinkModal
            item={item}
            onClose={() => setTngPickerOpen(false)}
            onLink={(transaction) => {
              onLinkTngTransaction(item, transaction);
              setTngPickerOpen(false);
            }}
            transactions={tngTransactions}
            visible={tngPickerOpen}
          />
          <ReceiptViewerModal
            onClose={() => setReceiptViewerOpen(false)}
            receipt={receipt.data ?? null}
            visible={receiptViewerOpen}
          />
        </View>
      </View>
    </Modal>
  );
}

function AddClaimItemModal({
  existingItems,
  kind,
  onAddItem,
  onClose,
  rates,
  trips
}: {
  existingItems: ClaimItemDraft[];
  kind: ClaimModalKind | null;
  onAddItem: (input: {
    amountCents: number;
    itemDate: string;
    notes: string | null;
    receipt?: LocalReceiptFile | null;
    mode?: string | null;
    tngTransactionId?: string | null;
    tripId?: string | null;
    title: string;
    type: ClaimItemType;
  }) => void;
  onClose: () => void;
  rates: ClaimRates;
  trips: TripDraft[];
}) {
  const [transportType, setTransportType] = useState<ClaimItemType>("grab");
  const [date, setDate] = useState(todayInput());
  const [amount, setAmount] = useState("0.00");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [paidViaTng, setPaidViaTng] = useState(false);
  const [receipt, setReceipt] = useState<LocalReceiptFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [claimMode, setClaimMode] = useState<"fixed_rate" | "receipt">(
    "fixed_rate"
  );
  const [mealSession, setMealSession] = useState<MealSession>("NOON");
  const [checkInDate, setCheckInDate] = useState(todayInput());
  const [checkOutDate, setCheckOutDate] = useState(tomorrowInput());
  const [perDiemDays, setPerDiemDays] = useState("1");
  const [perDiemRate, setPerDiemRate] = useState(rates.perDiemRate);

  if (!kind) {
    return null;
  }

  const meta = getModalMeta(kind, transportType);
  const amountCents = moneyToCents(amount);
  const usedTripIds = new Set(
    existingItems
      .filter((item) => item.type === "mileage" && item.tripId)
      .map((item) => item.tripId)
  );
  const eligibleTrips = trips.filter(
    (trip) =>
      trip.status === "final" &&
      trip.finalDistanceM != null &&
      trip.finalDistanceM > 0 &&
      !usedTripIds.has(trip.id)
  );
  const selectedTrip =
    eligibleTrips.find((trip) => trip.id === selectedTripId) ?? eligibleTrips[0] ?? null;
  const selectedTripRate = selectedTrip
    ? parseRate(
        selectedTrip.vehicleType === "motorcycle"
          ? rates.mileageMotorcycleRate
          : rates.mileageCarRate
      )
    : 0;
  const selectedTripKm = selectedTrip?.finalDistanceM
    ? selectedTrip.finalDistanceM / 1000
    : 0;
  const mileageAmountCents = centsFromNumber(selectedTripKm * selectedTripRate);
  const mealRateCents = getMealRateCents(rates, mealSession);
  const lodgingNights = calculateNights(checkInDate, checkOutDate);
  const lodgingDatesValid = isAfterDate(checkOutDate, checkInDate);
  const lodgingAmountCents =
    claimMode === "fixed_rate"
      ? centsFromNumber(lodgingNights * parseRate(rates.lodgingRate))
      : amountCents;
  const perDiemDayCount = Math.max(0, Number(perDiemDays) || 0);
  const perDiemAmountCents = centsFromNumber(
    perDiemDayCount * parseRate(perDiemRate)
  );
  const effectiveAmountCents =
    kind === "mileage"
      ? mileageAmountCents
      : kind === "meal" && claimMode === "fixed_rate"
        ? mealRateCents
        : kind === "lodging"
          ? lodgingAmountCents
          : kind === "per_diem"
            ? perDiemAmountCents
            : amountCents;
  const requiresDescription = kind === "other";
  const canAdd =
    Boolean(date) &&
    (kind === "mileage"
      ? Boolean(selectedTrip) && effectiveAmountCents > 0
      : kind === "per_diem"
        ? perDiemDayCount > 0 && effectiveAmountCents > 0
        : kind === "lodging"
          ? lodgingDatesValid && effectiveAmountCents > 0
        : paidViaTng || effectiveAmountCents > 0) &&
    (!requiresDescription || description.trim().length > 0);

  function handleAdd() {
    if (!date) {
      setErrorMessage("Please select a date.");
      return;
    }

    if (kind === "mileage" && !selectedTrip) {
      setErrorMessage("Please select a saved trip.");
      return;
    }

    if (kind === "per_diem" && (perDiemDayCount <= 0 || effectiveAmountCents <= 0)) {
      setErrorMessage("Please enter valid per diem days and rate.");
      return;
    }

    if (kind === "lodging" && !lodgingDatesValid) {
      setErrorMessage("Check-out date must be after check-in date.");
      return;
    }

    if (!paidViaTng && effectiveAmountCents <= 0) {
      setErrorMessage("Please enter an amount greater than 0.00.");
      return;
    }

    if (requiresDescription && !description.trim()) {
      setErrorMessage("Please enter a description.");
      return;
    }

    const itemDate =
      kind === "mileage" && selectedTrip
        ? selectedTrip.startedAt.slice(0, 10)
        : kind === "lodging"
          ? checkInDate
          : date;
    const generatedNotes = buildCalculatedNotes({
      checkOutDate,
      claimMode,
      kind: kind as ClaimModalKind,
      lodgingNights,
      mealSession,
      notes,
      paidViaTng,
      perDiemDayCount,
      perDiemRate,
      rates,
      selectedTrip,
      selectedTripKm,
      selectedTripRate
    });

    onAddItem({
      amountCents: paidViaTng ? 0 : effectiveAmountCents,
      itemDate,
      mode: paidViaTng ? "tng_pending" : null,
      notes: generatedNotes,
      receipt,
      tngTransactionId: null,
      title:
        description.trim() ||
        (kind === "mileage" && selectedTrip
          ? tripTitle(selectedTrip)
          : kind === "meal" && claimMode === "fixed_rate"
            ? `${meta.defaultTitle} - ${mealSessionLabel(mealSession)}`
            : kind === "lodging"
              ? `${meta.defaultTitle} - ${lodgingNights} night${lodgingNights === 1 ? "" : "s"}`
              : meta.defaultTitle),
      tripId: kind === "mileage" ? selectedTrip?.id ?? null : null,
      type: meta.type
    });
    setAmount("0.00");
    setDescription("");
    setNotes("");
    setPaidViaTng(false);
    setReceipt(null);
    setErrorMessage(null);
    setSelectedTripId(null);
    setClaimMode("fixed_rate");
    setMealSession("NOON");
    setCheckInDate(todayInput());
    setCheckOutDate(tomorrowInput());
    setPerDiemDays("1");
    setPerDiemRate(rates.perDiemRate);
    onClose();
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>Add {meta.title}</Text>
              <Text style={styles.modalSubtitle}>
                {paidViaTng ? meta.tngSubtitle : meta.subtitle}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

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

            {kind === "mileage" ? (
              <View style={styles.field}>
                <Text style={styles.label}>Saved Trip *</Text>
                {eligibleTrips.length === 0 ? (
                  <View style={styles.emptyTripPicker}>
                    <Text style={styles.emptyTripTitle}>No unclaimed final trips</Text>
                    <Text style={styles.emptyTripCopy}>
                      Finalize a trip in Trips first, then return here to add it
                      as mileage.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.tripPickerList}>
                    {eligibleTrips.map((trip) => {
                      const isSelected = (selectedTrip?.id ?? null) === trip.id;
                      const tripRate = parseRate(
                        trip.vehicleType === "motorcycle"
                          ? rates.mileageMotorcycleRate
                          : rates.mileageCarRate
                      );
                      const tripAmount = centsFromNumber(
                        ((trip.finalDistanceM ?? 0) / 1000) * tripRate
                      );

                      return (
                        <Pressable
                          accessibilityRole="button"
                          key={trip.id}
                          onPress={() => setSelectedTripId(trip.id)}
                          style={[
                            styles.tripPickerItem,
                            isSelected ? styles.tripPickerItemActive : null
                          ]}
                        >
                          <View style={styles.tripPickerBody}>
                            <Text style={styles.tripPickerTitle}>
                              {tripTitle(trip)}
                            </Text>
                            <Text style={styles.tripPickerSub}>
                              {formatDate(trip.startedAt)} - {formatKm(trip.finalDistanceM ?? 0)} - {trip.vehicleType}
                            </Text>
                          </View>
                          <Text style={styles.tripPickerAmount}>
                            {formatMoney(tripAmount, "MYR")}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            {kind === "meal" || kind === "lodging" ? (
              <View style={styles.segmentedRow}>
                <SegmentButton
                  active={claimMode === "fixed_rate"}
                  label="Fixed Rate"
                  onPress={() => setClaimMode("fixed_rate")}
                />
                <SegmentButton
                  active={claimMode === "receipt"}
                  label="Receipt"
                  onPress={() => setClaimMode("receipt")}
                />
              </View>
            ) : null}

            {kind === "lodging" ? (
              <View style={styles.fieldRow}>
                <DatePickerField
                  label="Check-in *"
                  value={checkInDate}
                  onChange={setCheckInDate}
                />
                <DatePickerField
                  label="Check-out *"
                  value={checkOutDate}
                  onChange={setCheckOutDate}
                />
              </View>
            ) : kind === "mileage" ? null : (
              <DatePickerField label="Date *" value={date} onChange={setDate} />
            )}

            {kind === "meal" && claimMode === "fixed_rate" ? (
              <View style={styles.field}>
                <Text style={styles.label}>Meal Session</Text>
                <View style={styles.sessionGrid}>
                  {mealSessions.map((session) => (
                    <Pressable
                      accessibilityRole="button"
                      key={session.type}
                      onPress={() => setMealSession(session.type)}
                      style={[
                        styles.sessionOption,
                        mealSession === session.type ? styles.sessionOptionActive : null
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionOptionText,
                          mealSession === session.type
                            ? styles.sessionOptionTextActive
                            : null
                        ]}
                      >
                        {session.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <AmountPreview
                  label="Fixed Rate"
                  value={formatMoney(mealRateCents, "MYR")}
                />
              </View>
            ) : null}

            {kind === "lodging" && claimMode === "fixed_rate" ? (
              <AmountPreview
                label={`${lodgingNights} night${lodgingNights === 1 ? "" : "s"} x MYR ${parseRate(rates.lodgingRate).toFixed(2)}`}
                value={formatMoney(lodgingAmountCents, "MYR")}
              />
            ) : null}

            {kind === "per_diem" ? (
              <>
                <View style={styles.fieldRow}>
                  <Field
                    label="Days *"
                    keyboardType="decimal-pad"
                    value={perDiemDays}
                    onChangeText={setPerDiemDays}
                  />
                  <Field
                    label="Rate (MYR) *"
                    keyboardType="decimal-pad"
                    value={perDiemRate}
                    onChangeText={setPerDiemRate}
                  />
                </View>
                <AmountPreview
                  label={`${perDiemDayCount || 0} day${perDiemDayCount === 1 ? "" : "s"}`}
                  value={formatMoney(perDiemAmountCents, "MYR")}
                />
              </>
            ) : null}

            {paidViaTng ? (
              <View style={styles.tngPendingNotice}>
                <Text style={styles.tngPendingNoticeTitle}>
                  Amount from TNG import
                </Text>
                <Text style={styles.tngPendingNoticeCopy}>
                  This item will stay at MYR 0.00 until you link the imported
                  Touch 'n Go transaction.
                </Text>
              </View>
            ) : kind === "mileage" ? (
              selectedTrip ? (
                <AmountPreview
                  label={`${formatKm(selectedTrip.finalDistanceM ?? 0)} x MYR ${selectedTripRate.toFixed(2)}/km`}
                  value={formatMoney(mileageAmountCents, "MYR")}
                />
              ) : null
            ) : kind === "meal" && claimMode === "fixed_rate" ? null : kind === "lodging" && claimMode === "fixed_rate" ? null : kind === "per_diem" ? null : (
              <Field
                label={meta.amountLabel}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            )}
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
              disabled={!canAdd}
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.modalAddButton,
                !canAdd ? styles.disabled : null,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.modalAddText}>
                {paidViaTng
                  ? `Add ${meta.buttonLabel} - TNG`
                  : effectiveAmountCents > 0
                    ? `Add ${meta.buttonLabel} - ${formatMoney(effectiveAmountCents, "MYR")}`
                    : `Add ${meta.buttonLabel}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SegmentButton({
  active,
  label,
  onPress
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}
    >
      <Text
        style={[
          styles.segmentButtonText,
          active ? styles.segmentButtonTextActive : null
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AmountPreview({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.amountPreview}>
      <Text style={styles.amountPreviewLabel}>{label}</Text>
      <Text style={styles.amountPreviewValue}>{value}</Text>
    </View>
  );
}

function TngLinkModal({
  item,
  onClose,
  onLink,
  transactions,
  visible
}: {
  item: ClaimItemDraft;
  onClose: () => void;
  onLink: (transaction: TngTransaction) => void;
  transactions: TngTransaction[];
  visible: boolean;
}) {
  const candidates = useMemo(() => {
    const openTransactions = transactions.filter(
      (transaction) =>
        !transaction.claimed || transaction.claimItemId === item.id
    );
    const scored = openTransactions
      .map((transaction) => {
        const candidate = scorePair(transaction, item);
        return candidate
          ? candidate
          : matchTngToClaimItems([transaction], [item])[0] ?? null;
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> =>
        Boolean(candidate)
      );

    return scored.sort((left, right) => right.score - left.score);
  }, [item, transactions]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Link TNG Transaction</Text>
              <Text style={styles.modalSubtitle}>
                {item.title} - {formatDate(item.itemDate)}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {candidates.length === 0 ? (
              <View style={styles.tngEmptyBox}>
                <Text style={styles.tngEmptyTitle}>No matching TNG rows</Text>
                <Text style={styles.tngEmptyCopy}>
                  Import a statement in the TNG tab, then return here to link it.
                </Text>
              </View>
            ) : (
              candidates.map((candidate) => (
                <Pressable
                  accessibilityRole="button"
                  key={candidate.transaction.id}
                  onPress={() => onLink(candidate.transaction)}
                  style={[
                    styles.tngCandidate,
                    candidate.transaction.id === item.tngTransactionId
                      ? styles.tngCandidateActive
                      : null
                  ]}
                >
                  <View style={styles.tngCandidateMain}>
                    <Text style={styles.tngCandidateTitle}>
                      {tngSectorLabel(candidate.transaction.sector)}
                    </Text>
                    <Text style={styles.tngCandidateMeta}>
                      {formatDate(candidate.transaction.transactionDate)} - {locationLabel(candidate.transaction)}
                    </Text>
                    <Text style={styles.tngCandidateReason}>
                      {candidate.reasons.slice(0, 2).join(", ")}
                    </Text>
                  </View>
                  <View style={styles.tngCandidateRight}>
                    <Text style={styles.tngCandidateAmount}>
                      {formatMoney(candidate.transaction.amountCents, candidate.transaction.currency)}
                    </Text>
                    <Text style={styles.tngCandidateScore}>
                      {candidate.score}%
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
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

  useEffect(() => {
    if (!item) {
      return;
    }

    setDate(item.itemDate);
    setAmount((item.amountCents / 100).toFixed(2));
    setTitle(item.title);
    setNotes(item.notes ?? "");
    setReceipt(null);
  }, [item]);

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
        icon="📷"
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
        icon="📎"
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

function ReceiptViewerModal({
  onClose,
  receipt,
  visible
}: {
  onClose: () => void;
  receipt: ReceiptDraft | null;
  visible: boolean;
}) {
  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.receiptViewerSheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Receipt</Text>
              <Text style={styles.receiptViewerSub}>
                {receipt?.uploadStatus ?? "local"} - {receipt?.syncStatus ?? "pending"}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>
          <View style={styles.receiptViewerBody}>
            {receipt?.localUri?.startsWith("blob:") ||
            receipt?.localUri?.startsWith("data:") ? (
              <View style={styles.receiptImageFrame}>
                <Text style={styles.receiptViewerIcon}>🧾</Text>
                <Text style={styles.receiptViewerTitle}>Local receipt selected</Text>
                <Text style={styles.receiptViewerCopy}>
                  This file is stored locally and queued for upload.
                </Text>
              </View>
            ) : (
              <View style={styles.receiptImageFrame}>
                <Text style={styles.receiptViewerIcon}>🧾</Text>
                <Text style={styles.receiptViewerTitle}>
                  {receipt ? "Receipt metadata available" : "Receipt not loaded"}
                </Text>
                <Text style={styles.receiptViewerCopy}>
                  {receipt?.localUri ?? "The local receipt record is not available yet."}
                </Text>
              </View>
            )}
            {receipt ? (
              <View style={styles.receiptViewerMeta}>
                <MetricLine label="Type" value={receipt.mimeType ?? "image"} />
                <MetricLine label="Size" value={formatFileSize(receipt.fileSize)} />
                <MetricLine label="Upload" value={receipt.uploadStatus} />
                <MetricLine label="Sync" value={receipt.syncStatus} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.receiptMetricLine}>
      <Text style={styles.receiptMetricLabel}>{label}</Text>
      <Text style={styles.receiptMetricValue}>{value}</Text>
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
      amountLabel: "Amount (MYR) *",
      buttonLabel: transport?.label ?? "Transport",
      defaultTitle: transport?.label ?? "Transport",
      descriptionLabel: "Route / Description (optional)",
      subtitle: "Choose transport type, date, amount, route, notes, and receipt.",
      title: "Transport",
      tngSubtitle: "Add the transport item now, then link the imported TNG row before submit.",
      type: transportType
    };
  }

  const meta = getItemMeta(kind);
  const modalCopy: Record<
    Exclude<ClaimModalKind, "transport">,
    { amountLabel: string; descriptionLabel: string; subtitle: string; tngSubtitle: string }
  > = {
    lodging: {
      amountLabel: "Amount (MYR) *",
      descriptionLabel: "Hotel / Stay description (optional)",
      subtitle: "Add lodging cost with date, amount, notes, and receipt.",
      tngSubtitle: "TNG is not used for lodging in this modal."
    },
    meal: {
      amountLabel: "Amount (MYR) *",
      descriptionLabel: "Merchant / Meal description (optional)",
      subtitle: "Add meal cost with date, amount, notes, and receipt.",
      tngSubtitle: "TNG is not used for meals in this modal."
    },
    mileage: {
      amountLabel: "Amount (MYR) *",
      descriptionLabel: "Route / Description (optional)",
      subtitle: "Add mileage date, amount, route, notes, and receipt.",
      tngSubtitle: "TNG is not used for mileage in this modal."
    },
    other: {
      amountLabel: "Amount (MYR) *",
      descriptionLabel: "Description *",
      subtitle: "Describe the misc claim clearly, then add amount and receipt.",
      tngSubtitle: "TNG is not used for misc claims in this modal."
    },
    parking: {
      amountLabel: "Amount (MYR) *",
      descriptionLabel: "Parking location (optional)",
      subtitle: "Add parking manually or mark as TNG pending.",
      tngSubtitle: "Add the parking item now, then link the imported TNG row before submit."
    },
    per_diem: {
      amountLabel: "Amount (MYR) *",
      descriptionLabel: "Destination / Description (optional)",
      subtitle: "Add per diem date, amount, destination, notes, and receipt.",
      tngSubtitle: "TNG is not used for per diem in this modal."
    },
    toll: {
      amountLabel: "Amount (MYR) *",
      descriptionLabel: "Entry / Exit / Description (optional)",
      subtitle: "Add toll manually or mark as TNG pending.",
      tngSubtitle: "Add the toll item now, then link the imported TNG row before submit."
    }
  };
  const copy = modalCopy[kind];

  return {
    amountLabel: copy.amountLabel,
    buttonLabel: meta.label,
    defaultTitle: meta.label,
    descriptionLabel: copy.descriptionLabel,
    subtitle: copy.subtitle,
    title: meta.label,
    tngSubtitle: copy.tngSubtitle,
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

function parseRate(value: string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function centsFromNumber(value: number) {
  return Math.max(0, Math.round(value * 100));
}

function getMealRateCents(rates: ClaimRates, session: MealSession) {
  if (session === "FULL_DAY") {
    return centsFromNumber(parseRate(rates.fullDayMealRate));
  }

  if (session === "MORNING") {
    return centsFromNumber(parseRate(rates.mealMorningRate));
  }

  if (session === "EVENING") {
    return centsFromNumber(parseRate(rates.mealEveningRate));
  }

  return centsFromNumber(parseRate(rates.mealNoonRate));
}

function mealSessionLabel(session: MealSession) {
  return mealSessions.find((item) => item.type === session)?.label ?? "Meal";
}

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 1;
  }

  return Math.max(1, Math.round((end - start) / 86_400_000));
}

function tripTitle(trip: TripDraft) {
  if (trip.originText && trip.destinationText) {
    return `${trip.originText} -> ${trip.destinationText}`;
  }

  if (trip.originText) {
    return trip.originText;
  }

  if (trip.destinationText) {
    return trip.destinationText;
  }

  return `Trip ${formatDate(trip.startedAt)}`;
}

function formatKm(distanceM: number) {
  return `${(distanceM / 1000).toFixed(2)} km`;
}

function buildCalculatedNotes({
  checkOutDate,
  claimMode,
  kind,
  lodgingNights,
  mealSession,
  notes,
  paidViaTng,
  perDiemDayCount,
  perDiemRate,
  selectedTrip,
  selectedTripKm,
  selectedTripRate
}: {
  checkOutDate: string;
  claimMode: "fixed_rate" | "receipt";
  kind: ClaimModalKind;
  lodgingNights: number;
  mealSession: MealSession;
  notes: string;
  paidViaTng: boolean;
  perDiemDayCount: number;
  perDiemRate: string;
  rates: ClaimRates;
  selectedTrip: TripDraft | null;
  selectedTripKm: number;
  selectedTripRate: number;
}) {
  const generated: string[] = [];

  if (kind === "mileage" && selectedTrip) {
    generated.push(
      `Trip ${selectedTrip.id}`,
      `${selectedTripKm.toFixed(2)} km x MYR ${selectedTripRate.toFixed(2)}/km`
    );
  }

  if (kind === "meal") {
    generated.push(
      claimMode === "fixed_rate"
        ? `Fixed rate meal - ${mealSessionLabel(mealSession)}`
        : "Receipt meal"
    );
  }

  if (kind === "lodging") {
    generated.push(
      claimMode === "fixed_rate"
        ? `Fixed rate lodging - ${lodgingNights} night${lodgingNights === 1 ? "" : "s"}`
        : `Receipt lodging - ${lodgingNights} night${lodgingNights === 1 ? "" : "s"}`,
      `Check-out: ${checkOutDate}`
    );
  }

  if (kind === "per_diem") {
    generated.push(
      `${perDiemDayCount} day${perDiemDayCount === 1 ? "" : "s"} x MYR ${parseRate(perDiemRate).toFixed(2)}`
    );
  }

  if (paidViaTng) {
    generated.push("Paid via TNG - pending transaction link.");
  }

  return [notes.trim(), ...generated].filter(Boolean).join("\n") || null;
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

function locationLabel(transaction: TngTransaction) {
  const route = [transaction.entryLocation, transaction.exitLocation]
    .filter(Boolean)
    .join(" -> ");

  return transaction.location ?? (route || "No location");
}

function tngSectorLabel(sector: TngTransaction["sector"]) {
  if (sector === "TOLL") {
    return "Toll";
  }

  if (sector === "PARKING") {
    return "Parking";
  }

  return "Retail transport";
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

function tomorrowInput() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toISOString().slice(0, 10);
}

function isAfterDate(value: string, compareTo: string) {
  return new Date(value).getTime() > new Date(compareTo).getTime();
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
    flexWrap: "wrap",
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
  itemRowPressed: {
    backgroundColor: "#f8fafc"
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
  tngPendingText: {
    color: "#c2410c",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 3
  },
  tngLinkedText: {
    color: "#0f766e",
    fontSize: 10,
    fontWeight: "900",
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
  tngLinkButton: {
    alignItems: "center",
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 26,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  tngLinkButtonText: {
    color: "#c2410c",
    fontSize: 10,
    fontWeight: "900"
  },
  tngLinkedButton: {
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    borderColor: "#99f6e4",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 26,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  tngLinkedButtonText: {
    color: "#0f766e",
    fontSize: 10,
    fontWeight: "900"
  },
  unlinkTngButton: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 26,
    justifyContent: "center",
    paddingHorizontal: 8
  },
  unlinkTngText: {
    color: "#64748b",
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
  itemMiniActions: {
    flexDirection: "row",
    gap: 4
  },
  viewReceiptButton: {
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 26,
    justifyContent: "center",
    paddingHorizontal: 7
  },
  viewReceiptText: {
    color: "#2563eb",
    fontSize: 10,
    fontWeight: "900"
  },
  removeReceiptMiniButton: {
    alignItems: "center",
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 26,
    justifyContent: "center",
    paddingHorizontal: 7
  },
  removeReceiptMiniText: {
    color: "#c2410c",
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
  submitNotice: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: spacing.md
  },
  submitNoticeTitle: {
    color: "#9a3412",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  submitNoticeCopy: {
    color: "#c2410c",
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
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
  modalHeaderCopy: {
    flex: 1,
    minWidth: 0
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3
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
  amountPreview: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  amountPreviewLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.caption,
    fontWeight: "800",
    lineHeight: 18
  },
  amountPreviewValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  emptyTripPicker: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md
  },
  emptyTripTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  emptyTripCopy: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  segmentedRow: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    padding: 4
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 7,
    flex: 1,
    minHeight: 38,
    justifyContent: "center"
  },
  segmentButtonActive: {
    backgroundColor: colors.surface
  },
  segmentButtonText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  segmentButtonTextActive: {
    color: colors.text
  },
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  sessionOption: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    justifyContent: "center"
  },
  sessionOptionActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac"
  },
  sessionOptionText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  sessionOptionTextActive: {
    color: "#166534"
  },
  tripPickerList: {
    gap: spacing.sm
  },
  tripPickerItem: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 62,
    padding: spacing.md
  },
  tripPickerItemActive: {
    backgroundColor: "#dcfce7",
    borderColor: "#86efac"
  },
  tripPickerBody: {
    flex: 1,
    minWidth: 0
  },
  tripPickerTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  tripPickerSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 3
  },
  tripPickerAmount: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  tngPendingNotice: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md
  },
  tngPendingNoticeTitle: {
    color: "#9a3412",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  tngPendingNoticeCopy: {
    color: "#c2410c",
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  itemDetailHero: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  itemDetailIcon: {
    fontSize: 26,
    textAlign: "center",
    width: 36
  },
  itemDetailHeroText: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  itemDetailTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  itemDetailSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  detailTable: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  detailLine: {
    alignItems: "flex-start",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  detailLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800",
    width: 82
  },
  detailValue: {
    color: colors.text,
    flex: 1,
    fontSize: typography.caption,
    fontWeight: "900",
    lineHeight: 18,
    textAlign: "right"
  },
  detailActionGrid: {
    gap: spacing.sm
  },
  detailPrimaryAction: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 46,
    justifyContent: "center"
  },
  detailPrimaryText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "900"
  },
  detailSecondaryAction: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center"
  },
  detailSecondaryText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  detailDangerAction: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center"
  },
  detailDangerText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  field: {
    flex: 1,
    gap: 6,
    minWidth: 0
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "800"
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
  tngEmptyBox: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 140,
    justifyContent: "center",
    padding: spacing.lg
  },
  tngEmptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  tngEmptyCopy: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center"
  },
  tngCandidate: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 70,
    padding: spacing.md
  },
  tngCandidateActive: {
    backgroundColor: "#f0fdfa",
    borderColor: "#0f766e"
  },
  tngCandidateMain: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  tngCandidateTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  tngCandidateMeta: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  tngCandidateReason: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16
  },
  tngCandidateRight: {
    alignItems: "flex-end",
    gap: 4
  },
  tngCandidateAmount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  tngCandidateScore: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3
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
    fontSize: 22,
    lineHeight: 26,
    textAlign: "center",
    width: 34
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
  receiptViewerSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: "92%",
    maxWidth: 460,
    overflow: "hidden",
    width: "100%"
  },
  receiptViewerSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800",
    marginTop: 3
  },
  receiptViewerBody: {
    gap: spacing.md,
    padding: spacing.lg
  },
  receiptImageFrame: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 180,
    justifyContent: "center",
    padding: spacing.lg
  },
  receiptViewerIcon: {
    fontSize: 36
  },
  receiptViewerTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
    textAlign: "center"
  },
  receiptViewerCopy: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center"
  },
  receiptViewerMeta: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  receiptMetricLine: {
    alignItems: "center",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  receiptMetricLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  receiptMetricValue: {
    color: colors.text,
    fontSize: typography.caption,
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
