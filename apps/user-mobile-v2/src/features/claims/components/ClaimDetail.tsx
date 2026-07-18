import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
// KeyboardSafeScrollView replaced with plain ScrollView in modals (sheet now has flex:1)

import { DatePickerField } from "@/components/DatePickerField";
import { AiReviewModal } from "./AiReviewModal";
import type { AiReviewSelection } from "./AiReviewModal";
import type {
  ClaimDraft,
  ClaimItemDraft,
  ClaimItemType
} from "@/features/claims/types";
import { useReceiptDraft } from "@/features/receipts/hooks/useReceiptUploadSummary";
import { useReceiptDisplayUri } from "@/features/receipts/hooks/useReceiptDisplayUri";
import type { LocalReceiptFile, ReceiptDraft } from "@/features/receipts/types";
import { canUseFeature } from "@/features/subscription/featureGates";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { useByokGeminiKey } from "@/features/ai/hooks/useByokGeminiKey";
import { extractReceiptFieldsDirect } from "@/features/ai/geminiDirectClient";
import { matchTngToClaimItems, scorePair } from "@/features/tng/matcher";
import type { TngTransaction } from "@/features/tng/types";
import type { TripDraft } from "@/features/trips/types";
import { useAuthStore } from "@/state/authStore";
import type { ClaimRates } from "@/state/settingsStore";
import { getSyncBaseUrl } from "@/sync/syncConfig";
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
    mealSession?: string | null;
    lodgingCheckIn?: string | null;
    lodgingCheckOut?: string | null;
    perdiemDays?: number | null;
    perdiemRateMyr?: number | null;
    perdiemDestination?: string | null;
    merchant?: string | null;
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

type ClaimItemCategoryFilter =
  | "all"
  | "mileage"
  | "transport"
  | "tng"
  | "meal"
  | "lodging"
  | "per_diem"
  | "other";
type ClaimItemSortKey = "date_desc" | "date_asc" | "category" | "amount_desc";

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

// Used in the multi-select meal session UI (excludes Full Day which is handled separately)
const mealSessions_CONST = [
  { type: "MORNING" as MealSession, icon: "🌅", label: "Morning", sub: "Breakfast" },
  { type: "NOON" as MealSession, icon: "🌤", label: "Noon", sub: "Lunch" },
  { type: "EVENING" as MealSession, icon: "🌙", label: "Evening", sub: "Dinner" },
];

const claimItemFilters: Array<{
  label: string;
  value: ClaimItemCategoryFilter;
}> = [
  { label: "All", value: "all" },
  { label: "Mileage", value: "mileage" },
  { label: "Transport", value: "transport" },
  { label: "TNG", value: "tng" },
  { label: "Meal", value: "meal" },
  { label: "Lodging", value: "lodging" },
  { label: "Per Diem", value: "per_diem" },
  { label: "Misc", value: "other" }
];

const claimItemSorts: Array<{ label: string; value: ClaimItemSortKey }> = [
  { label: "Newest", value: "date_desc" },
  { label: "Oldest", value: "date_asc" },
  { label: "Category", value: "category" },
  { label: "Amount", value: "amount_desc" }
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
  const [itemCategoryFilter, setItemCategoryFilter] =
    useState<ClaimItemCategoryFilter>("all");
  const [itemFilterOpen, setItemFilterOpen] = useState(false);
  const [itemSort, setItemSort] = useState<ClaimItemSortKey>("date_desc");
  const [itemSortOpen, setItemSortOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState(false);
  const [editingItem, setEditingItem] = useState<ClaimItemDraft | null>(null);
  const [viewingItemId, setViewingItemId] = useState<string | null>(null);
  // Always derive from the live items array so receipt/TNG button labels stay current
  const viewingItem = viewingItemId
    ? (items.find((i) => i.id === viewingItemId) ?? null)
    : null;
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
  const visibleItems = useMemo(
    () =>
      sortClaimItems(
        items.filter((item) => filterClaimItem(item, itemCategoryFilter)),
        itemSort
      ),
    [itemCategoryFilter, itemSort, items]
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
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
      style={styles.pageScroll}
    >
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
        {items.length > 0 ? (
          <View style={styles.listToolbar}>
            <Text style={styles.sectionTitle}>
              Items ({visibleItems.length}/{items.length})
            </Text>
            <View style={styles.toolbarActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setItemFilterOpen(true)}
                style={styles.toolbarMenuButton}
              >
                <Text style={styles.toolbarMenuText}>
                  {claimItemFilterLabel(itemCategoryFilter)} ▾
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setItemSortOpen(true)}
                style={styles.toolbarMenuButton}
              >
                <Text style={styles.toolbarMenuText}>
                  {claimItemSortLabel(itemSort)} ▾
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={styles.sectionTitle}>Items ({items.length})</Text>
        )}
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
            {visibleItems.length === 0 ? (
              <View style={styles.emptyItemsInline}>
                <Text style={styles.emptyCopy}>No items match this filter.</Text>
              </View>
            ) : null}
            {visibleItems.map((item) => (
              <ClaimItemRow
                item={item}
                key={item.id}
                onOpen={() => setViewingItemId(item.id)}
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
        onClose={() => setViewingItemId(null)}
        onDelete={(item) =>
          confirmAction("Delete item?", "Remove this item from the claim.", () => {
            onDeleteItem(item);
            setViewingItemId(null);
          })
        }
        onEdit={(item) => {
          setViewingItemId(null);
          setEditingItem(item);
        }}
        onLinkTngTransaction={onLinkTngTransaction}
        onRemoveReceipt={(item) => onRemoveReceipt(item)}
        onUnlinkTngTransaction={(item) => onUnlinkTngTransaction(item)}
        tngTransactions={tngTransactions}
      />
      <OptionSheet
        isVisible={itemFilterOpen}
        onClose={() => setItemFilterOpen(false)}
        onSelect={(value) => {
          setItemCategoryFilter(value);
          setItemFilterOpen(false);
        }}
        options={claimItemFilters}
        selectedValue={itemCategoryFilter}
        title="Filter items"
      />
      <OptionSheet
        isVisible={itemSortOpen}
        onClose={() => setItemSortOpen(false)}
        onSelect={(value) => {
          setItemSort(value);
          setItemSortOpen(false);
        }}
        options={claimItemSorts}
        selectedValue={itemSort}
        title="Sort items"
      />
    </ScrollView>
  );
}

/**
 * Compact item row — tap the whole row to open the detail/action modal.
 * No inline buttons: keeps the list tight regardless of how many items exist.
 */
function ClaimItemRow({
  item,
  onOpen,
  tngTransactions
}: {
  item: ClaimItemDraft;
  onOpen: () => void;
  tngTransactions: TngTransaction[];
}) {
  const meta = getItemMeta(item.type);
  const isTngPending = item.mode === "tng_pending";
  const isTngLinked = !!item.tngTransactionId;
  const hasReceipt = !!item.receiptId;

  // Compact status chips shown inline
  const chips: { label: string; style: "warn" | "ok" | "muted" }[] = [];
  if (isTngPending && !isTngLinked) chips.push({ label: "TNG pending", style: "warn" });
  if (isTngLinked) chips.push({ label: "TNG linked", style: "ok" });
  if (hasReceipt) chips.push({ label: "🧾", style: "ok" });

  return (
    <Pressable
      accessibilityLabel={`${meta.label} ${item.title}, ${formatMoney(item.amountCents, item.currency)}`}
      accessibilityRole="button"
      onPress={onOpen}
      style={({ pressed }) => [styles.compactItemRow, pressed ? styles.compactItemRowPressed : null]}
    >
      {/* Date */}
      <Text style={styles.compactDate}>{formatShortDate(item.itemDate)}</Text>
      {/* Icon */}
      <Text style={styles.compactIcon}>{meta.icon}</Text>
      {/* Title + chips */}
      <View style={styles.compactBody}>
        <Text numberOfLines={1} style={styles.compactTitle}>{item.title || meta.label}</Text>
        {chips.length > 0 ? (
          <View style={styles.compactChips}>
            {chips.map((chip) => (
              <View key={chip.label} style={[styles.compactChip, chip.style === "warn" ? styles.chipWarn : chip.style === "ok" ? styles.chipOk : styles.chipMuted]}>
                <Text style={[styles.compactChipText, chip.style === "warn" ? styles.chipTextWarn : chip.style === "ok" ? styles.chipTextOk : styles.chipTextMuted]}>{chip.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      {/* Amount + chevron */}
      <View style={styles.compactRight}>
        <Text style={[styles.compactAmount, isTngPending && !isTngLinked ? styles.compactAmountPending : null]}>
          {isTngPending && !isTngLinked ? "—" : formatMoney(item.amountCents, item.currency)}
        </Text>
        <Text style={styles.compactChevron}>›</Text>
      </View>
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

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" style={styles.modalScroll}>
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
                    onPress={() =>
                      confirmAction(
                        "Unlink TNG Transaction?",
                        "This removes the TNG link from this item. The transaction will return to Open status.",
                        () => onUnlinkTngTransaction(item)
                      )
                    }
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
    mealSession?: string | null;
    lodgingCheckIn?: string | null;
    lodgingCheckOut?: string | null;
    perdiemDays?: number | null;
    perdiemRateMyr?: number | null;
    perdiemDestination?: string | null;
    merchant?: string | null;
  }) => void;
  onClose: () => void;
  rates: ClaimRates;
  trips: TripDraft[];
}) {
  const [transportType, setTransportType] = useState<ClaimItemType>("grab");
  const [date, setDate] = useState(todayInput());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [paidViaTng, setPaidViaTng] = useState(false);
  const [receipt, setReceipt] = useState<LocalReceiptFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [claimMode, setClaimMode] = useState<"fixed_rate" | "receipt">(
    "fixed_rate"
  );
  // Meal: multi-select sessions (Morning, Noon, Evening) or Full Day
  const [mealSessions, setMealSessions] = useState<Set<MealSession>>(new Set(["NOON"]));
  const [mealFullDay, setMealFullDay] = useState(false);
  const [checkInDate, setCheckInDate] = useState(todayInput());
  const [checkOutDate, setCheckOutDate] = useState(tomorrowInput());
  // Toll / Parking location fields
  const [entryLocation, setEntryLocation] = useState("");
  const [exitLocation, setExitLocation] = useState("");
  const [parkingLocation, setParkingLocation] = useState("");
  const [perDiemDays, setPerDiemDays] = useState("1");
  const [perDiemRate, setPerDiemRate] = useState(rates.perDiemRate);
  // AI Capture S1 (mobile) — 2026-07-17
  // AI Capture — Review Sheet (2026-07-18): extraction no longer auto-fills
  // silently. It opens AiReviewModal with whatever Gemini returned; the user
  // picks which fields to apply. See AiReviewModal.tsx for why (fixes a
  // date-fill bug where the old "still today's default" guard could desync
  // from the date picker's local-time parsing).
  const [aiFilled, setAiFilled] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReviewFields, setAiReviewFields] = useState<AiExtractedFields | null>(null);

  function handleAiExtracted(fields: AiExtractedFields) {
    setAiError(null);
    const hasAnyField = fields.amount != null || !!fields.date || !!fields.merchant;
    if (!hasAnyField) {
      setAiError("AI couldn't read this receipt clearly — please enter the details manually.");
      return;
    }
    setAiReviewFields(fields);
  }

  function handleAiApply(selection: AiReviewSelection) {
    let filled = false;
    if (selection.amount != null) {
      setAmount(String(selection.amount));
      filled = true;
    }
    if (selection.date) {
      setDate(selection.date);
      filled = true;
    }
    if (selection.merchant) {
      setDescription(selection.merchant);
      filled = true;
    }
    setAiReviewFields(null);
    setAiFilled(filled);
  }

  function handleAiError(message: string) {
    setAiFilled(false);
    setAiError(message);
  }

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
  // Meal: sum all selected sessions (or full day rate)
  const mealRateCents = mealFullDay
    ? centsFromNumber(parseRate(rates.fullDayMealRate))
    : [...mealSessions].reduce(
        (sum, s) => sum + getMealRateCents(rates, s),
        0
      );
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
  const mealSessionsValid = mealFullDay || mealSessions.size > 0;
  const canAdd =
    Boolean(date) &&
    (kind === "mileage"
      ? Boolean(selectedTrip) && effectiveAmountCents > 0
      : kind === "per_diem"
        ? perDiemDayCount > 0 && effectiveAmountCents > 0
        : kind === "lodging"
          ? lodgingDatesValid && effectiveAmountCents > 0
        : kind === "meal" && claimMode === "fixed_rate"
          ? mealSessionsValid
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

    if (kind === "meal" && claimMode === "fixed_rate" && !mealSessionsValid) {
      setErrorMessage("Select at least one meal session.");
      return;
    }

    // Require amount > 0 for non-TNG, non-fixed-rate-meal, non-mileage, non-per-diem items
    const needsAmount = !paidViaTng && !(kind === "meal" && claimMode === "fixed_rate") && kind !== "mileage" && kind !== "per_diem";
    if (needsAmount && effectiveAmountCents <= 0) {
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

    // Build session label for meal title
    const mealSessionDesc = mealFullDay
      ? "Full Day"
      : [...mealSessions].map((s) => mealSessionLabel(s)).join(" + ");

    // Build location note for toll/parking
    const locationNote =
      kind === "toll"
        ? [entryLocation.trim() && `Entry: ${entryLocation.trim()}`, exitLocation.trim() && `Exit: ${exitLocation.trim()}`].filter(Boolean).join(", ")
        : kind === "parking"
          ? parkingLocation.trim()
          : "";

    const generatedNotes = buildCalculatedNotes({
      checkOutDate,
      claimMode,
      kind: kind as ClaimModalKind,
      lodgingNights,
      locationNote,
      mealSessionDesc,
      notes,
      paidViaTng,
      perDiemDayCount,
      perDiemRate,
      rates,
      selectedTrip,
      selectedTripKm,
      selectedTripRate
    });

    // For meal fixed_rate, create one item per session (or one full day item)
    if (kind === "meal" && claimMode === "fixed_rate") {
      if (mealFullDay) {
        onAddItem({
          amountCents: centsFromNumber(parseRate(rates.fullDayMealRate)),
          itemDate,
          mealSession: "FULL_DAY",
          mode: "fixed_rate",
          notes: [notes.trim(), "Full Day meal"].filter(Boolean).join("\n") || null,
          receipt: null,
          tngTransactionId: null,
          title: description.trim() || "Meal - Full Day",
          tripId: null,
          type: "meal"
        });
      } else {
        for (const s of mealSessions) {
          onAddItem({
            amountCents: getMealRateCents(rates, s),
            itemDate,
            mealSession: s,
            mode: "fixed_rate",
            notes: [notes.trim(), `${mealSessionLabel(s)} meal`].filter(Boolean).join("\n") || null,
            receipt: null,
            tngTransactionId: null,
            title: description.trim() || `Meal - ${mealSessionLabel(s)}`,
            tripId: null,
            type: "meal"
          });
        }
      }
    } else {
      onAddItem({
        amountCents: paidViaTng ? 0 : effectiveAmountCents,
        itemDate,
        lodgingCheckIn: kind === "lodging" ? checkInDate : null,
        lodgingCheckOut: kind === "lodging" ? checkOutDate : null,
        merchant: kind !== "mileage" && kind !== "per_diem" && kind !== "lodging" && kind !== "meal"
          ? description.trim() || null
          : null,
        mode: paidViaTng ? "tng_pending" : null,
        notes: generatedNotes,
        perdiemDays: kind === "per_diem" ? perDiemDayCount : null,
        perdiemDestination: kind === "per_diem" ? description.trim() || null : null,
        perdiemRateMyr: kind === "per_diem" ? parseRate(perDiemRate) : null,
        receipt,
        tngTransactionId: null,
        title:
          description.trim() ||
          (kind === "mileage" && selectedTrip
            ? tripTitle(selectedTrip)
            : kind === "lodging"
              ? `${meta.defaultTitle} - ${lodgingNights} night${lodgingNights === 1 ? "" : "s"}`
              : meta.defaultTitle),
        tripId: kind === "mileage" ? selectedTrip?.id ?? null : null,
        type: meta.type
      });
    }

    setAmount("");
    setDescription("");
    setNotes("");
    setPaidViaTng(false);
    setReceipt(null);
    setErrorMessage(null);
    setSelectedTripId(null);
    setClaimMode("fixed_rate");
    setMealSessions(new Set(["NOON"]));
    setMealFullDay(false);
    setCheckInDate(todayInput());
    setCheckOutDate(tomorrowInput());
    setAiFilled(false);
    setAiError(null);
    setPerDiemDays("1");
    setPerDiemRate(rates.perDiemRate);
    setEntryLocation("");
    setExitLocation("");
    setParkingLocation("");
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

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" style={styles.modalScroll}>
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
                      onPress={() => {
                        setTransportType(transport.type);
                        // FLIGHT cannot be paid via TNG
                        if (transport.type === "flight") setPaidViaTng(false);
                      }}
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

            {/* TNG toggle: Toll, Parking, and non-Flight transport only */}
            {kind === "toll" || kind === "parking" || (kind === "transport" && transportType !== "flight") ? (
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
                <Text style={styles.label}>Sessions (tap to select multiple)</Text>
                {/* Full Day option */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { setMealFullDay((p) => !p); }}
                  style={[styles.sessionRow, mealFullDay ? styles.sessionRowActive : null]}
                >
                  <Text style={styles.sessionRowIcon}>☀️</Text>
                  <View style={styles.sessionRowBody}>
                    <Text style={[styles.sessionRowLabel, mealFullDay ? styles.sessionRowLabelActive : null]}>Full Day</Text>
                    <Text style={styles.sessionRowSub}>Breakfast + Lunch + Dinner</Text>
                  </View>
                  <Text style={styles.sessionRowRate}>MYR {parseRate(rates.fullDayMealRate).toFixed(2)}</Text>
                </Pressable>
                <View style={styles.sessionDivider}><Text style={styles.sessionDividerText}>or by session</Text></View>
                {mealSessions_CONST.map((s) => {
                  const selected = !mealFullDay && mealSessions.has(s.type);
                  const rate = getMealRateCents(rates, s.type) / 100;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={s.type}
                      onPress={() => {
                        if (mealFullDay) return;
                        setMealSessions((prev) => {
                          const next = new Set(prev);
                          next.has(s.type) ? next.delete(s.type) : next.add(s.type);
                          return next;
                        });
                      }}
                      style={[styles.sessionRow, selected ? styles.sessionRowActive : null, mealFullDay ? styles.sessionRowDisabled : null]}
                    >
                      <Text style={styles.sessionRowIcon}>{s.icon}</Text>
                      <View style={styles.sessionRowBody}>
                        <Text style={[styles.sessionRowLabel, selected ? styles.sessionRowLabelActive : null]}>{s.label}</Text>
                        <Text style={styles.sessionRowSub}>{s.sub}</Text>
                      </View>
                      <Text style={styles.sessionRowRate}>MYR {rate.toFixed(2)}</Text>
                    </Pressable>
                  );
                })}
                {mealRateCents > 0 ? (
                  <AmountPreview label="Total" value={formatMoney(mealRateCents, "MYR")} />
                ) : null}
              </View>
            ) : null}

            {/* Toll location fields */}
            {kind === "toll" ? (
              <>
                <Field label="Entry Plaza (optional)" value={entryLocation} onChangeText={setEntryLocation} />
                <Field label="Exit Plaza (optional)" value={exitLocation} onChangeText={setExitLocation} />
              </>
            ) : null}

            {/* Parking location field */}
            {kind === "parking" ? (
              <Field label="Location (optional)" value={parkingLocation} onChangeText={setParkingLocation} />
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
            {kind !== "mileage" ? (
              <>
                <Field
                  label={meta.descriptionLabel}
                  value={description}
                  onChangeText={setDescription}
                />
                <Field label="Notes (optional)" value={notes} onChangeText={setNotes} />
                <View style={styles.field}>
                  <Text style={styles.label}>Receipt (optional)</Text>
                  {aiFilled ? (
                    <View style={styles.aiHint}>
                      <Text style={styles.aiHintText}>
                        ✨ AI-suggested from your receipt — review before saving
                      </Text>
                    </View>
                  ) : null}
                  {aiError ? (
                    <View style={styles.aiErrorHint}>
                      <Text style={styles.aiErrorHintText}>🤖 {aiError}</Text>
                    </View>
                  ) : null}
                  <ReceiptCaptureField
                    onChange={setReceipt}
                    value={receipt}
                    onExtracted={handleAiExtracted}
                    onAiError={handleAiError}
                  />
                </View>
              </>
            ) : null}
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
      <AiReviewModal
        currentAmount={amount}
        currentDate={date}
        currentMerchant={description}
        fields={aiReviewFields}
        merchantLabel={meta.descriptionLabel ?? "Description"}
        onApply={handleAiApply}
        onDismiss={() => setAiReviewFields(null)}
        visible={!!aiReviewFields}
      />
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

function OptionSheet<T extends string>({
  isVisible,
  onClose,
  onSelect,
  options,
  selectedValue,
  title
}: {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  selectedValue: T;
  title: string;
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.optionSheet}>
          <View style={styles.optionSheetHeader}>
            <Text style={styles.optionSheetTitle}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>
          <View style={styles.optionList}>
            {options.map((option) => {
              const isActive = option.value === selectedValue;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={[
                    styles.optionRow,
                    isActive ? styles.optionRowActive : null
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive ? styles.optionTextActive : null
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isActive ? <Text style={styles.optionCheck}>OK</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
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
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" style={styles.modalScroll}>
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
  const [date, setDate] = useState(item?.itemDate ?? todayInput());
  const [amount, setAmount] = useState(item ? (item.amountCents / 100).toFixed(2) : "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [receipt, setReceipt] = useState<LocalReceiptFile | null>(null);
  // AI Capture — Review Sheet (2026-07-18): Edit used to never let AI touch
  // date (the item already has a real date) — now the review modal makes
  // that explicit user choice instead of a hard-coded rule, so a re-scan can
  // correct a wrong date too, but only if the user opts in per field.
  const [aiFilled, setAiFilled] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReviewFields, setAiReviewFields] = useState<AiExtractedFields | null>(null);

  useEffect(() => {
    if (!item) return;
    setDate(item.itemDate);
    setAmount((item.amountCents / 100).toFixed(2));
    setTitle(item.title);
    setNotes(item.notes ?? "");
    setReceipt(null);
    setAiFilled(false);
    setAiError(null);
    setAiReviewFields(null);
  }, [item?.id]);

  function handleAiExtracted(fields: AiExtractedFields) {
    setAiError(null);
    const hasAnyField = fields.amount != null || !!fields.date || !!fields.merchant;
    if (!hasAnyField) {
      setAiError("AI couldn't read this receipt clearly — please enter the details manually.");
      return;
    }
    setAiReviewFields(fields);
  }

  function handleAiApply(selection: AiReviewSelection) {
    let filled = false;
    if (selection.amount != null) {
      setAmount(String(selection.amount));
      filled = true;
    }
    if (selection.date) {
      setDate(selection.date);
      filled = true;
    }
    if (selection.merchant) {
      setTitle(selection.merchant);
      filled = true;
    }
    setAiReviewFields(null);
    setAiFilled(filled);
  }

  function handleAiError(message: string) {
    setAiFilled(false);
    setAiError(message);
  }

  if (!item) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>Edit {getItemMeta(item.type).label}</Text>
              <Text style={styles.modalSubtitle}>{getItemMeta(item.type).icon} — updating amount, date, description, notes and receipt</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" style={styles.modalScroll}>
            <DatePickerField label="Date *" onChange={setDate} value={date} />
            <Field
              keyboardType="decimal-pad"
              label="Amount (MYR) *"
              onChangeText={setAmount}
              value={amount}
              placeholder="0.00"
            />
            <Field label="Description" onChangeText={setTitle} value={title} placeholder={getItemMeta(item.type).label} />
            <Field label="Notes (optional)" onChangeText={setNotes} value={notes} placeholder="Additional notes" />
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
              {aiFilled ? (
                <View style={styles.aiHint}>
                  <Text style={styles.aiHintText}>
                    ✨ AI-suggested from your receipt — review before saving
                  </Text>
                </View>
              ) : null}
              {aiError ? (
                <View style={styles.aiErrorHint}>
                  <Text style={styles.aiErrorHintText}>🤖 {aiError}</Text>
                </View>
              ) : null}
              <ReceiptCaptureField
                onChange={setReceipt}
                value={receipt?.localUri === "" ? null : receipt}
                onExtracted={handleAiExtracted}
                onAiError={handleAiError}
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
      <AiReviewModal
        currentAmount={amount}
        currentDate={date}
        currentMerchant={title}
        fields={aiReviewFields}
        merchantLabel="Title"
        onApply={handleAiApply}
        onDismiss={() => setAiReviewFields(null)}
        visible={!!aiReviewFields}
      />
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
  value,
  onExtracted,
  onAiError
}: {
  onChange: (receipt: LocalReceiptFile | null) => void;
  value: LocalReceiptFile | null;
  // AI Capture S1 (mobile) — fires once, right after a receipt is picked
  // (camera or gallery), with whatever /api/ai/extract-receipt proposed.
  // Only attempted at all when the account can actually use the feature
  // (canScan below) — unlike the web version, we know the tier client-side
  // here, so there's no point calling out just to get a 403 back.
  onExtracted?: (fields: AiExtractedFields) => void;
  onAiError?: (message: string) => void;
}) {
  const { tier } = useSubscription();
  // AI Capture S5 (BYOK) — a saved personal Gemini key unlocks scanning on
  // any tier, including FREE, and routes the call directly to Gemini from
  // the device instead of through myexpensio's shared-key /api/ai/* route.
  const { data: byokKey } = useByokGeminiKey();
  const canScan = canUseFeature(tier, "receipt_scan") || !!byokKey;
  const accessToken = useAuthStore((s) => s.session?.accessToken ?? null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  async function handlePicked(receipt: LocalReceiptFile | null) {
    if (!receipt) return;
    onChange(receipt);
    if (!canScan) return; // manual entry, no AI attempted

    if (byokKey) {
      setAiAnalyzing(true);
      const base64 = await FileSystem.readAsStringAsync(receipt.localUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      const { fields, error } = await extractReceiptFieldsDirect(base64, byokKey);
      setAiAnalyzing(false);
      if (fields) onExtracted?.(fields);
      else if (error) onAiError?.(error);
      return;
    }

    if (!accessToken) return; // shared-key path needs a signed-in session
    setAiAnalyzing(true);
    const { fields, error } = await extractReceiptFields(receipt, accessToken);
    setAiAnalyzing(false);
    if (fields) onExtracted?.(fields);
    else if (error) onAiError?.(error);
  }

  function handleCameraPress() {
    if (!canScan) {
      Alert.alert(
        "PRO Feature",
        "Camera scanning requires a PRO subscription — or add your own free Gemini key in Settings → AI Receipt Scanning to unlock it on any plan.",
        [{ text: "OK" }]
      );
      return;
    }
    void openLocalReceiptPicker("camera").then(handlePicked);
  }

  return (
    <View style={styles.receiptCapture}>
      <ReceiptChoice
        icon={canScan ? "📷" : "🔒"}
        onPress={handleCameraPress}
        selected={value?.source === "camera"}
        sub={
          canScan
            ? byokKey
              ? "Camera - scanned with your own Gemini key"
              : "Camera - auto edge detect - perspective fix"
            : "PRO feature — upgrade to unlock, or add your own key in Settings"
        }
        title="Scan Document"
      />
      <ReceiptChoice
        icon="📎"
        onPress={() => void openLocalReceiptPicker("gallery").then(handlePicked)}
        selected={value?.source === "gallery"}
        sub="JPEG - PNG - WebP - Max 5 MB"
        title="Attach from Gallery"
      />
      {aiAnalyzing ? (
        <View style={styles.aiAnalyzingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.aiAnalyzingText}>🤖 Reading receipt…</Text>
        </View>
      ) : null}
      {value ? (
        <View style={styles.receiptPreview}>
          {value.localUri ? (
            <Image
              source={{ uri: value.localUri }}
              style={styles.receiptThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.receiptThumbPlaceholder}>
              <Text style={{ fontSize: 20 }}>🧾</Text>
            </View>
          )}
          <View style={styles.receiptPreviewBody}>
            <Text style={styles.receiptPreviewTitle} numberOfLines={1}>{value.name}</Text>
            <Text style={styles.receiptPreviewSub}>
              {value.mimeType ?? "image"} · {formatFileSize(value.fileSize)}
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
  const { uri: displayUri, loading: uriLoading, deviceOnly } = useReceiptDisplayUri(
    receipt?.localUri,
    receipt?.remotePath
  );

  if (!visible) {
    return null;
  }

  const showImage = !!displayUri && !deviceOnly;
  const showDeviceOnly = deviceOnly && Platform.OS === "web";
  const showLoading = uriLoading && Platform.OS === "web";

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
            {showLoading ? (
              <View style={styles.receiptImageFrame}>
                <ActivityIndicator size="large" />
                <Text style={styles.receiptViewerCopy}>Loading receipt…</Text>
              </View>
            ) : showDeviceOnly ? (
              <View style={styles.receiptImageFrame}>
                <Text style={styles.receiptViewerIcon}>📱</Text>
                <Text style={styles.receiptViewerTitle}>Receipt on device only</Text>
                <Text style={styles.receiptViewerCopy}>
                  This receipt was saved locally on your Android device and has not been
                  uploaded to the cloud. Open the Android app to view it.
                </Text>
              </View>
            ) : showImage ? (
              <View style={styles.receiptImageFrame}>
                <Image
                  source={{ uri: displayUri }}
                  style={styles.receiptFullImage}
                  resizeMode="contain"
                  onError={() => {/* silently fall through */}}
                />
              </View>
            ) : (
              <View style={styles.receiptImageFrame}>
                <Text style={styles.receiptViewerIcon}>🧾</Text>
                <Text style={styles.receiptViewerTitle}>Receipt not available</Text>
                <Text style={styles.receiptViewerCopy}>
                  The image could not be loaded. It may have been moved or not yet synced.
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
  placeholder,
  value
}: {
  keyboardType?: "default" | "decimal-pad";
  label: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType ?? "default"}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        selectTextOnFocus
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

function filterClaimItem(
  item: ClaimItemDraft,
  filter: ClaimItemCategoryFilter
) {
  if (filter === "all") {
    return true;
  }

  if (filter === "transport") {
    return ["bus", "flight", "grab", "taxi", "train"].includes(item.type);
  }

  if (filter === "tng") {
    return item.mode === "tng_pending" || item.mode === "tng_linked";
  }

  return item.type === filter;
}

function sortClaimItems(items: ClaimItemDraft[], sort: ClaimItemSortKey) {
  return [...items].sort((left, right) => {
    if (sort === "date_asc") {
      return left.itemDate.localeCompare(right.itemDate);
    }

    if (sort === "category") {
      return getItemMeta(left.type).label.localeCompare(getItemMeta(right.type).label);
    }

    if (sort === "amount_desc") {
      return right.amountCents - left.amountCents;
    }

    return right.itemDate.localeCompare(left.itemDate);
  });
}

function claimItemFilterLabel(value: ClaimItemCategoryFilter) {
  return claimItemFilters.find((option) => option.value === value)?.label ?? "All";
}

function claimItemSortLabel(value: ClaimItemSortKey) {
  return claimItemSorts.find((option) => option.value === value)?.label ?? "Newest";
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
  locationNote,
  lodgingNights,
  mealSessionDesc,
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
  locationNote?: string;
  lodgingNights: number;
  mealSessionDesc?: string;
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
        ? `Fixed rate meal${mealSessionDesc ? ` - ${mealSessionDesc}` : ""}`
        : "Receipt meal"
    );
  }

  if ((kind === "toll" || kind === "parking") && locationNote) {
    generated.push(locationNote);
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

function formatShortDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-MY", { day: "2-digit", month: "short" });
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

// ── AI Capture S1 (mobile) — 2026-07-17 ──────────────────────────────────────
// Calls the same /api/ai/extract-receipt endpoint apps/user's web pages use.
// Mirrors apps/user/components/ScanPreviewModal.tsx's extractReceiptFields,
// adapted for a local file URI (expo-file-system) instead of a Blob, and for
// the mobile app's Bearer-token auth (session.accessToken) instead of cookies.
export type AiExtractedFields = {
  amount: number | null;
  currency: string;
  date: string | null;
  merchant: string | null;
  category_guess: string | null;
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

async function extractReceiptFields(
  file: LocalReceiptFile,
  accessToken: string
): Promise<{ fields?: AiExtractedFields; error?: string }> {
  try {
    const base64 = await FileSystem.readAsStringAsync(file.localUri, {
      encoding: FileSystem.EncodingType.Base64
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    let response: Response;
    try {
      response = await fetch(`${getSyncBaseUrl()}/api/ai/extract-receipt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ image: base64 }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const rawText = await response.text();
    let json: Record<string, unknown>;
    try {
      json = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
    } catch {
      json = {};
    }

    if (!response.ok) {
      const message =
        (json?.error as { message?: string } | undefined)?.message ??
        `AI extraction failed (HTTP ${response.status}).`;
      console.warn("[ReceiptCaptureField] AI extraction declined:", response.status, json);
      return { error: message };
    }

    return { fields: json as unknown as AiExtractedFields };
  } catch (e: unknown) {
    const message =
      e instanceof Error && e.name === "AbortError"
        ? "AI extraction timed out. Please try again or enter this receipt manually."
        : (e as Error)?.message ?? "AI extraction failed.";
    console.warn("[ReceiptCaptureField] AI extraction error:", message);
    return { error: message };
  }
}

async function openLocalReceiptPicker(
  source: LocalReceiptFile["source"]
): Promise<LocalReceiptFile | null> {
  if (Platform.OS !== "web") {
    // ── Native: use expo-image-picker ────────────────────────────────────────
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.82,
      allowsEditing: false,
      base64: false,
      exif: false,
    };

    let result: ImagePicker.ImagePickerResult;

    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera permission required",
          "Please allow camera access in Settings to snap receipts."
        );
        return null;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Photo library permission required",
          "Please allow photo access in Settings to attach receipts from your gallery."
        );
        return null;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const srcUri = asset.uri;
    const mimeType = asset.mimeType ?? "image/jpeg";
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const filename = `receipt-${Date.now()}.${ext}`;

    // ── Copy to permanent app storage so it survives cache clears ──────────
    let permanentUri = srcUri;
    try {
      const dir = `${FileSystem.documentDirectory}receipts/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
      const destUri = `${dir}${filename}`;
      await FileSystem.copyAsync({ from: srcUri, to: destUri });
      permanentUri = destUri;
    } catch {
      // Fall back to original URI if copy fails — still usable this session
      permanentUri = srcUri;
    }

    // Get accurate file size from the permanent copy
    let fileSize: number | null = asset.fileSize ?? null;
    try {
      const info = await FileSystem.getInfoAsync(permanentUri);
      if (info.exists && "size" in info) fileSize = info.size ?? fileSize;
    } catch { /* ignore */ }

    return {
      fileSize,
      localUri: permanentUri,
      mimeType,
      name: filename,
      source,
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

// Local date parts, not UTC — must match DatePickerField.tsx's toDateInput().
// Bug (2026-07-18): these previously used toISOString().slice(0,10), which is
// UTC. For MYR/Malaysia (UTC+8), any time between 00:00–08:00 local, that
// returned *yesterday's* date while DatePickerField displayed today — so the
// AI-fill guard `date === todayInput()` silently failed and receipt dates
// never got applied. Always compute local date parts instead.
function toLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function todayInput() {
  return toLocalDateInput(new Date());
}

function tomorrowInput() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return toLocalDateInput(tomorrow);
}

function isAfterDate(value: string, compareTo: string) {
  return new Date(value).getTime() > new Date(compareTo).getTime();
}

const styles = StyleSheet.create({
  pageScroll: {
    flex: 1
  },
  page: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl
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
  listToolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  toolbarActions: {
    flexDirection: "row",
    flexShrink: 0,
    gap: 6
  },
  toolbarMenuButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  toolbarMenuText: {
    color: colors.text,
    fontSize: typography.caption,
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
    paddingRight: spacing.md
  },
  itemOpenArea: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 68,
    minWidth: 0,
    paddingLeft: spacing.md,
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
  emptyItemsInline: {
    alignItems: "center",
    backgroundColor: colors.surface,
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
  filterPanel: {
    backgroundColor: "rgba(248, 250, 252, 0.86)",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm
  },
  filterLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0,
    paddingHorizontal: 4,
    textTransform: "uppercase"
  },
  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800"
  },
  filterChipTextActive: {
    color: colors.onPrimary
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
  modalScroll: {
    flex: 1
  },
  // ── Compact item row ──────────────────────────────────────────────────────
  compactItemRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: 10
  },
  compactItemRowPressed: {
    backgroundColor: "#f8fafc"
  },
  compactDate: {
    color: "#64748b",
    flexShrink: 0,
    fontSize: 11,
    fontWeight: "700",
    width: 46
  },
  compactIcon: {
    flexShrink: 0,
    fontSize: 16,
    width: 22
  },
  compactBody: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  compactTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  compactChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  compactChip: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  chipWarn: { backgroundColor: "#fef9c3" },
  chipOk: { backgroundColor: "#dcfce7" },
  chipMuted: { backgroundColor: "#f1f5f9" },
  compactChipText: {
    fontSize: 10,
    fontWeight: "800"
  },
  chipTextWarn: { color: "#854d0e" },
  chipTextOk: { color: "#15803d" },
  chipTextMuted: { color: "#64748b" },
  compactRight: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 2
  },
  compactAmount: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  compactAmountPending: {
    color: "#854d0e"
  },
  compactChevron: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 18
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
    flex: 1,
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
  optionSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    maxWidth: 420,
    padding: spacing.md,
    width: "100%"
  },
  optionSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.xs
  },
  optionSheetTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  optionList: {
    gap: 6
  },
  optionRow: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  optionRowActive: {
    backgroundColor: "#f1f5f9"
  },
  optionText: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "800"
  },
  optionTextActive: {
    color: colors.primary
  },
  optionCheck: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
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
    backgroundColor: "#eef2f7",
    borderRadius: 14,
    flexDirection: "row",
    gap: 4,
    padding: 4
  },
  segmentButton: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    minHeight: 40,
    justifyContent: "center"
  },
  segmentButtonActive: {
    backgroundColor: colors.primary
  },
  segmentButtonText: {
    color: "#64748b",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  segmentButtonTextActive: {
    color: colors.onPrimary
  },
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  sessionRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: 4,
    minHeight: 52,
    paddingHorizontal: spacing.md
  },
  sessionRowActive: {
    backgroundColor: "#f0fdf4",
    borderColor: "#0f766e"
  },
  sessionRowDisabled: {
    opacity: 0.4
  },
  sessionRowIcon: {
    fontSize: 20
  },
  sessionRowBody: {
    flex: 1,
    gap: 2
  },
  sessionRowLabel: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  sessionRowLabelActive: {
    color: "#0f766e",
    fontWeight: "900"
  },
  sessionRowSub: {
    color: colors.muted,
    fontSize: 11
  },
  sessionRowRate: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  sessionDivider: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.xs
  },
  sessionDividerText: {
    color: colors.muted,
    fontSize: 11
  },
  sessionOption: {
    alignItems: "center",
    backgroundColor: "rgba(248, 250, 252, 0.82)",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: spacing.md,
    justifyContent: "center"
  },
  sessionOptionActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e"
  },
  sessionOptionText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  sessionOptionTextActive: {
    color: colors.onPrimary
  },
  tripPickerList: {
    gap: spacing.sm
  },
  tripPickerItem: {
    alignItems: "center",
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 62,
    padding: spacing.md
  },
  tripPickerItemActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#0f766e"
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
  // AI Capture S1 (mobile) — 2026-07-17
  aiHint: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.sm
  },
  aiHintText: {
    color: "#0369a1",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  aiErrorHint: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.sm
  },
  aiErrorHintText: {
    color: "#b45309",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  aiAnalyzingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    paddingVertical: spacing.xs
  },
  aiAnalyzingText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700"
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
    padding: spacing.sm
  },
  receiptThumb: {
    borderRadius: 6,
    height: 52,
    width: 52
  },
  receiptThumbPlaceholder: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  receiptFullImage: {
    borderRadius: 8,
    height: 320,
    width: "100%"
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
