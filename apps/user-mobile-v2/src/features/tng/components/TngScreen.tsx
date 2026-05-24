import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { useSaveTngPreview, useSoftDeleteTngStatementBatch } from "@/features/tng/hooks/useTngActions";
import {
  useTngLibrarySummary,
  useTngStatementBatches,
  useTngTransactions
} from "@/features/tng/hooks/useTngLibrary";
import type {
  TngParsedRow,
  TngSector,
  TngStatementBatch,
  TngTransaction,
  TngTransactionFilters
} from "@/features/tng/types";
import { colors, spacing, typography } from "@/theme/tokens";

type PreviewRow = TngParsedRow & {
  id: string;
  selected: boolean;
};

const sampleRows: PreviewRow[] = [
  {
    amountCents: 280,
    entryLocation: "DUKE Sentul",
    exitLocation: "DUKE Ampang",
    id: "sample-1",
    rawPayload: { source: "sample" },
    sector: "TOLL",
    selected: true,
    transactionDate: "2026-05-23",
    transNo: "SAMPLE-TOLL-001"
  },
  {
    amountCents: 450,
    id: "sample-2",
    location: "KLCC Parking",
    rawPayload: { source: "sample" },
    sector: "PARKING",
    selected: true,
    transactionDate: "2026-05-23",
    transNo: "SAMPLE-PARK-001"
  },
  {
    amountCents: 1850,
    id: "sample-3",
    location: "Grab Ride",
    rawPayload: { source: "sample" },
    sector: "RETAIL",
    selected: true,
    transactionDate: "2026-05-22",
    transNo: "SAMPLE-RETAIL-001"
  }
];

export function TngScreen() {
  const [filters, setFilters] = useState<TngTransactionFilters>({
    claimed: "all",
    sector: "ALL"
  });
  const [importOpen, setImportOpen] = useState(false);
  const batches = useTngStatementBatches();
  const transactions = useTngTransactions(filters);
  const summary = useTngLibrarySummary();
  const savePreview = useSaveTngPreview();
  const deleteBatch = useSoftDeleteTngStatementBatch();

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>TNG Transactions</Text>
          <Text style={styles.subtitle}>
            Import statement rows, keep the library local, then link eligible rows to claims.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => setImportOpen(true)}
          style={styles.importButton}
        >
          <Text style={styles.importButtonText}>Import</Text>
        </Pressable>
      </View>

      <View style={styles.summaryGrid}>
        <SummaryMetric
          label="Rows"
          value={`${summary.data?.transactions ?? 0}`}
        />
        <SummaryMetric
          label="Unclaimed"
          value={`${summary.data?.unclaimed ?? 0}`}
        />
        <SummaryMetric
          label="Total"
          value={formatMoney(summary.data?.totalAmountCents ?? 0)}
        />
      </View>

      <View style={styles.segmentGroup}>
        {(["ALL", "TOLL", "PARKING", "RETAIL"] as const).map((sector) => (
          <SegmentButton
            active={filters.sector === sector}
            key={sector}
            label={sector === "ALL" ? "All" : sectorLabel(sector)}
            onPress={() => setFilters((current) => ({ ...current, sector }))}
          />
        ))}
      </View>

      <View style={styles.segmentGroup}>
        {(["all", "unclaimed", "claimed"] as const).map((claimed) => (
          <SegmentButton
            active={filters.claimed === claimed}
            key={claimed}
            label={claimed[0].toUpperCase() + claimed.slice(1)}
            onPress={() => setFilters((current) => ({ ...current, claimed }))}
          />
        ))}
      </View>

      {batches.data && batches.data.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statements</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.batchRow}>
              {batches.data.map((batch) => (
                <BatchCard
                  batch={batch}
                  isDeleting={deleteBatch.isPending}
                  key={batch.id}
                  onDelete={() => deleteBatch.mutate(batch.id)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Library</Text>
        {transactions.isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : transactions.data && transactions.data.length > 0 ? (
          <View style={styles.list}>
            {transactions.data.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No TNG rows yet</Text>
            <Text style={styles.emptyCopy}>
              Import a statement preview to build the local transaction library.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setImportOpen(true)}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Import Statement</Text>
            </Pressable>
          </View>
        )}
      </View>

      <TngImportModal
        isSaving={savePreview.isPending}
        onClose={() => setImportOpen(false)}
        onSave={async (input) => {
          await savePreview.mutateAsync(input);
          setImportOpen(false);
        }}
        visible={importOpen}
      />
    </View>
  );
}

function TngImportModal({
  isSaving,
  onClose,
  onSave,
  visible
}: {
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: {
    label: string;
    rows: TngParsedRow[];
    sourceFileName?: string | null;
    sourceFileUri?: string | null;
  }) => Promise<void>;
  visible: boolean;
}) {
  const [label, setLabel] = useState(monthLabel());
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const selectedRows = useMemo(
    () => rows.filter((row) => row.selected),
    [rows]
  );
  const selectedTotal = selectedRows.reduce(
    (sum, row) => sum + row.amountCents,
    0
  );

  function reset() {
    setLabel(monthLabel());
    setFileName(null);
    setRows([]);
  }

  async function chooseFile() {
    if (Platform.OS !== "web") {
      setFileName("Selected TNG statement.pdf");
      setRows(sampleRows);
      return;
    }

    const documentRef = (globalThis as typeof globalThis & {
      document?: Document;
    }).document;

    if (!documentRef) {
      return;
    }

    const input = documentRef.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      if (!file) {
        return;
      }

      setFileName(file.name);
      setRows(
        sampleRows.map((row, index) => ({
          ...row,
          id: `${file.name}-${index}`,
          rawPayload: { fileName: file.name, parser: "sample-preview" }
        }))
      );
    };
    input.click();
  }

  async function handleSave() {
    if (selectedRows.length === 0) {
      return;
    }

    await onSave({
      label,
      rows: selectedRows.map(({ id: _id, selected: _selected, ...row }) => row),
      sourceFileName: fileName,
      sourceFileUri: fileName ? `local://tng/${fileName}` : null
    });
    reset();
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderCopy}>
              <Text style={styles.modalTitle}>Import TNG Statement</Text>
              <Text style={styles.modalSub}>
                Foundation pass uses a local preview path. Backend PDF parsing and appendices come later.
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.field}>
              <Text style={styles.label}>Statement Label</Text>
              <TextInput
                onChangeText={setLabel}
                placeholder="May 2026 TNG"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={label}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => void chooseFile()}
              style={styles.filePicker}
            >
              <View style={styles.fileIcon}>
                <Text style={styles.fileIconText}>PDF</Text>
              </View>
              <View style={styles.filePickerCopy}>
                <Text style={styles.filePickerTitle}>
                  {fileName ?? "Select TNG PDF"}
                </Text>
                <Text style={styles.filePickerSub}>
                  Parser preview is saved locally for matching groundwork.
                </Text>
              </View>
              <Text style={styles.fileArrow}>{">"}</Text>
            </Pressable>

            {rows.length === 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setFileName("sample-tng-statement.pdf");
                  setRows(sampleRows);
                }}
                style={styles.sampleButton}
              >
                <Text style={styles.sampleButtonText}>Use Sample Preview</Text>
              </Pressable>
            ) : (
              <View style={styles.previewBox}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>Preview Rows</Text>
                  <Text style={styles.previewTotal}>
                    {selectedRows.length} selected - {formatMoney(selectedTotal)}
                  </Text>
                </View>
                {rows.map((row) => (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: row.selected }}
                    key={row.id}
                    onPress={() =>
                      setRows((current) =>
                        current.map((item) =>
                          item.id === row.id
                            ? { ...item, selected: !item.selected }
                            : item
                        )
                      )
                    }
                    style={[
                      styles.previewRow,
                      row.selected ? styles.previewRowSelected : null
                    ]}
                  >
                    <Text style={styles.checkbox}>{row.selected ? "x" : ""}</Text>
                    <View style={styles.previewMain}>
                      <Text style={styles.previewName}>
                        {sectorLabel(row.sector)}
                      </Text>
                      <Text style={styles.previewMeta}>
                        {formatDate(row.transactionDate)} - {row.entryLocation ?? row.location}
                        {row.exitLocation ? ` -> ${row.exitLocation}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.previewAmount}>
                      {formatMoney(row.amountCents)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={reset}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving || selectedRows.length === 0}
              onPress={() => void handleSave()}
              style={[
                styles.saveButton,
                isSaving || selectedRows.length === 0 ? styles.disabled : null
              ]}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? "Saving..." : "Save Selected"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BatchCard({
  batch,
  isDeleting,
  onDelete
}: {
  batch: TngStatementBatch;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <View style={styles.batchCard}>
      <Text numberOfLines={1} style={styles.batchTitle}>{batch.label}</Text>
      <Text style={styles.batchMeta}>
        {batch.transactionCount} rows - {formatDate(batch.importedAt)}
      </Text>
      <Text style={styles.batchAmount}>{formatMoney(batch.totalAmountCents)}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={isDeleting}
        onPress={onDelete}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    </View>
  );
}

function TransactionRow({ transaction }: { transaction: TngTransaction }) {
  return (
    <View style={styles.transactionRow}>
      <View style={styles.sectorBadge}>
        <Text style={styles.sectorBadgeText}>{sectorShort(transaction.sector)}</Text>
      </View>
      <View style={styles.transactionMain}>
        <Text style={styles.transactionTitle}>{sectorLabel(transaction.sector)}</Text>
        <Text style={styles.transactionMeta}>
          {formatDate(transaction.transactionDate)} - {locationLabel(transaction)}
        </Text>
        <Text style={styles.transactionSource}>
          {transaction.statementLabel ?? "TNG statement"} - {transaction.linkStatus}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>
          {formatMoney(transaction.amountCents)}
        </Text>
        <Text style={[
          styles.transactionStatus,
          transaction.claimed ? styles.statusClaimed : styles.statusOpen
        ]}>
          {transaction.claimed ? "Claimed" : "Open"}
        </Text>
      </View>
    </View>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
      style={[styles.segment, active ? styles.segmentActive : null]}
    >
      <Text style={[styles.segmentText, active ? styles.segmentTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function locationLabel(transaction: TngTransaction) {
  const routeLocation = [transaction.entryLocation, transaction.exitLocation]
    .filter(Boolean)
    .join(" -> ");

  return transaction.location ?? (routeLocation || "No location");
}

function monthLabel() {
  const now = new Date();
  return now.toLocaleDateString("en-MY", {
    month: "long",
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric"
  });
}

function sectorLabel(sector: TngSector | "ALL") {
  if (sector === "TOLL") {
    return "Toll";
  }

  if (sector === "PARKING") {
    return "Parking";
  }

  if (sector === "RETAIL") {
    return "Retail";
  }

  return "All";
}

function sectorShort(sector: TngSector) {
  if (sector === "TOLL") {
    return "T";
  }

  if (sector === "PARKING") {
    return "P";
  }

  return "R";
}

function formatMoney(cents: number) {
  return `MYR ${(cents / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric"
  });
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  headerCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  importButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  importButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  metric: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: spacing.md
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  segmentGroup: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    padding: 4
  },
  segment: {
    alignItems: "center",
    borderRadius: 7,
    flex: 1,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 4
  },
  segmentActive: {
    backgroundColor: colors.primary
  },
  segmentText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  segmentTextActive: {
    color: colors.onPrimary
  },
  section: {
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  batchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.lg
  },
  batchCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: spacing.md,
    width: 190
  },
  batchTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  batchMeta: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  batchAmount: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  deleteButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 30,
    paddingHorizontal: spacing.sm
  },
  deleteButtonText: {
    color: "#be123c",
    fontSize: 11,
    fontWeight: "900"
  },
  list: {
    gap: spacing.sm
  },
  transactionRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 76,
    padding: spacing.md
  },
  sectorBadge: {
    alignItems: "center",
    backgroundColor: "#ecfeff",
    borderColor: "#a5f3fc",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  sectorBadgeText: {
    color: "#0e7490",
    fontSize: typography.body,
    fontWeight: "900"
  },
  transactionMain: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  transactionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  transactionMeta: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  transactionSource: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700"
  },
  transactionRight: {
    alignItems: "flex-end",
    gap: 4
  },
  transactionAmount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  transactionStatus: {
    borderRadius: 999,
    fontSize: 10,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  statusClaimed: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8"
  },
  statusOpen: {
    backgroundColor: "#f0fdf4",
    color: "#15803d"
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 220,
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
    fontWeight: "700",
    lineHeight: 18,
    maxWidth: 260,
    textAlign: "center"
  },
  emptyButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  emptyButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
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
    maxWidth: 520,
    overflow: "hidden",
    width: "100%"
  },
  modalHeader: {
    alignItems: "flex-start",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
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
  modalSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 3
  },
  modalClose: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "900"
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
    fontWeight: "900"
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
  filePicker: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 68,
    padding: spacing.md
  },
  fileIcon: {
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  fileIconText: {
    color: "#0369a1",
    fontSize: 11,
    fontWeight: "900"
  },
  filePickerCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  filePickerTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  filePickerSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  fileArrow: {
    color: "#94a3b8",
    fontSize: 20,
    fontWeight: "900"
  },
  sampleButton: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 44
  },
  sampleButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "900"
  },
  previewBox: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  previewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  previewTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  previewTotal: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  previewRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    padding: spacing.sm
  },
  previewRowSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac"
  },
  checkbox: {
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    color: "#15803d",
    fontSize: typography.caption,
    fontWeight: "900",
    height: 24,
    lineHeight: 22,
    textAlign: "center",
    width: 24
  },
  previewMain: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  previewName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  previewMeta: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  previewAmount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  modalFooter: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
    padding: spacing.lg
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.lg
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.lg
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "900"
  },
  disabled: {
    opacity: 0.45
  }
});
