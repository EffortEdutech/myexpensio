import { useMemo, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import {
  ActivityIndicator,
  Clipboard,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import { useAuthStore } from "@/state/authStore";
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
import type { ClaimDraft } from "@/features/claims/types";
import { getSyncBaseUrl } from "@/sync/syncConfig";
import { colors, spacing, typography } from "@/theme/tokens";

type AddToClaim = (params: {
  claim: ClaimDraft;
  transaction: TngTransaction;
}) => Promise<void>;

type PreviewRow = TngParsedRow & {
  id: string;
  selected: boolean;
};

// ── Backend row → TngParsedRow ────────────────────────────────────────────
type BackendRow = {
  trans_no?: string | null;
  sector?: string;
  amount?: number;
  amount_cents?: number;
  entry_datetime?: string | null;
  exit_datetime?: string | null;
  entry_location?: string | null;
  exit_location?: string | null;
  location?: string | null;
  [key: string]: unknown;
};

function normalizeSector(s: string | undefined): TngSector {
  const u = (s ?? "").toUpperCase();
  if (u === "TOLL") return "TOLL";
  if (u === "PARKING") return "PARKING";
  return "RETAIL";
}

function mapBackendRows(raw: BackendRow[]): TngParsedRow[] {
  return raw.map((r) => {
    // Backend sends amount in MYR (not cents)
    const amountCents = r.amount_cents != null
      ? Number(r.amount_cents)
      : Math.round(Number(r.amount ?? 0) * 100);
    const date = (r.exit_datetime ?? r.entry_datetime ?? "").slice(0, 10)
      || new Date().toISOString().slice(0, 10);
    return {
      transNo: r.trans_no ?? null,
      sector: normalizeSector(r.sector),
      amountCents,
      transactionDate: date,
      entryDatetime: r.entry_datetime ?? null,
      exitDatetime: r.exit_datetime ?? null,
      entryLocation: r.entry_location ?? null,
      exitLocation: r.exit_location ?? null,
      location: r.location ?? r.entry_location ?? r.exit_location ?? null,
      rawPayload: { source: "tng-parse-api", ...r },
      currency: "MYR",
    };
  });
}

export function TngScreen({
  claims = [],
  onAddToClaim
}: {
  claims?: ClaimDraft[];
  onAddToClaim?: AddToClaim;
}) {
  const [filters, setFilters] = useState<TngTransactionFilters>({
    claimed: "all",
    sector: "ALL"
  });
  const [importOpen, setImportOpen] = useState(false);
  const [statementsOpen, setStatementsOpen] = useState(false);
  const [sectorSheetOpen, setSectorSheetOpen] = useState(false);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TngTransaction | null>(null);
  const [claimPickerOpen, setClaimPickerOpen] = useState(false);
  const [isAddingToClaim, setIsAddingToClaim] = useState(false);

  const draftClaims = useMemo(
    () => claims.filter((c) => c.status === "draft"),
    [claims]
  );
  const batches = useTngStatementBatches();
  const transactions = useTngTransactions(filters);
  const summary = useTngLibrarySummary();
  const savePreview = useSaveTngPreview();
  const deleteBatch = useSoftDeleteTngStatementBatch();

  const batchCount = batches.data?.length ?? 0;
  const txCount = summary.data?.transactions ?? 0;
  const unclaimed = summary.data?.unclaimed ?? 0;
  const total = summary.data?.totalAmountCents ?? 0;

  const sectorOptions = [
    { label: "All Types", value: "ALL" as const },
    { label: "🛣 Toll", value: "TOLL" as const },
    { label: "🅿 Parking", value: "PARKING" as const },
    { label: "🛒 Retail", value: "RETAIL" as const },
  ];
  const statusOptions = [
    { label: "All", value: "all" as const },
    { label: "Open", value: "unclaimed" as const },
    { label: "Claimed", value: "claimed" as const },
  ];

  const sectorLabel = sectorOptions.find(o => o.value === (filters.sector ?? "ALL"))?.label ?? "All Types";
  const statusLabel = statusOptions.find(o => o.value === (filters.claimed ?? "all"))?.label ?? "All";

  return (
    <View style={styles.page}>
      {/* ── Compact header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>TNG Transactions</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setImportOpen(true)}
          style={styles.importButton}
        >
          <Text style={styles.importButtonText}>+ Import</Text>
        </Pressable>
      </View>

      {/* ── Inline stats bar ── */}
      {txCount > 0 ? (
        <View style={styles.statsBar}>
          <Text style={styles.statItem}>
            <Text style={styles.statNum}>{txCount}</Text>
            <Text style={styles.statSep}> rows</Text>
          </Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.statItem}>
            <Text style={[styles.statNum, { color: unclaimed > 0 ? "#ca8a04" : colors.muted }]}>{unclaimed}</Text>
            <Text style={styles.statSep}> open</Text>
          </Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.statItem}>
            <Text style={styles.statNum}>{formatMoney(total)}</Text>
          </Text>
        </View>
      ) : null}

      {/* ── Statements accordion ── */}
      {batchCount > 0 ? (
        <View style={styles.statementsAccordion}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setStatementsOpen(v => !v)}
            style={styles.statementsHeader}
          >
            <Text style={styles.statementsHeaderText}>
              📋 {batchCount} Statement{batchCount !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.statementsChevron}>{statementsOpen ? "▴" : "▾"}</Text>
          </Pressable>
          {statementsOpen ? (
            <View style={styles.statementsBody}>
              {batches.data?.map((batch) => (
                <BatchRow
                  batch={batch}
                  isDeleting={deleteBatch.isPending}
                  key={batch.id}
                  onDelete={() => deleteBatch.mutate(batch.id)}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Filter toolbar ── */}
      <View style={styles.filterBar}>
        <Text style={styles.filterBarLabel}>
          {txCount > 0
            ? `${transactions.data?.length ?? 0}/${txCount} shown`
            : ""}
        </Text>
        <View style={styles.filterBarActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSectorSheetOpen(true)}
            style={styles.filterChip}
          >
            <Text style={styles.filterChipText}>{sectorLabel} ▾</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setStatusSheetOpen(true)}
            style={styles.filterChip}
          >
            <Text style={styles.filterChipText}>{statusLabel} ▾</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Transaction list ── */}
      {transactions.isLoading && !transactions.data ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (transactions.data?.length ?? 0) > 0 ? (
        <FlatList
          data={transactions.data}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          initialNumToRender={20}
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={transactions.isRefetching ?? false}
              onRefresh={() => transactions.refetch?.()}
            />
          }
          renderItem={({ item: transaction }) => (
            <TransactionRow
              transaction={transaction}
              onAddToClaim={onAddToClaim ? () => {
                setSelectedTx(transaction);
                setClaimPickerOpen(true);
              } : undefined}
            />
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{emptyStateTitle(filters)}</Text>
          <Text style={styles.emptyCopy}>{emptyStateCopy(filters)}</Text>
          {isUnfiltered(filters) ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setImportOpen(true)}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Import Statement</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <TngImportModal
        isSaving={savePreview.isPending}
        onClose={() => setImportOpen(false)}
        onSave={async (input) => {
          await savePreview.mutateAsync(input);
          setImportOpen(false);
        }}
        visible={importOpen}
      />

      {/* Add to Claim picker */}
      {claimPickerOpen && selectedTx ? (
        <Modal animationType="fade" onRequestClose={() => setClaimPickerOpen(false)} transparent visible>
          <View style={styles.modalOverlay}>
            <View style={styles.claimPickerSheet}>
              <View style={styles.claimPickerHeader}>
                <View style={styles.claimPickerHeaderBody}>
                  <Text style={styles.claimPickerTitle}>Add to Claim</Text>
                  <Text style={styles.claimPickerSub} numberOfLines={1}>
                    {sectorIcon(selectedTx.sector)} {locationLabel(selectedTx)} · {formatMoney(selectedTx.amountCents)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { setClaimPickerOpen(false); setSelectedTx(null); }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>
              {draftClaims.length === 0 ? (
                <View style={styles.claimPickerEmpty}>
                  <Text style={styles.claimPickerEmptyText}>
                    No draft claims available. Create a draft claim first.
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.claimPickerScroll}>
                  {draftClaims.map((claim) => (
                    <Pressable
                      accessibilityRole="button"
                      key={claim.id}
                      disabled={isAddingToClaim}
                      onPress={async () => {
                        if (!onAddToClaim || !selectedTx) return;
                        setIsAddingToClaim(true);
                        try {
                          await onAddToClaim({ claim, transaction: selectedTx });
                          setClaimPickerOpen(false);
                          setSelectedTx(null);
                        } finally {
                          setIsAddingToClaim(false);
                        }
                      }}
                      style={[styles.claimPickerRow, isAddingToClaim ? styles.disabled : null]}
                    >
                      <View style={styles.claimPickerRowBody}>
                        <Text style={styles.claimPickerRowTitle} numberOfLines={1}>
                          {claim.title ?? "Draft claim"}
                        </Text>
                        <Text style={styles.claimPickerRowSub}>
                          {claim.periodStart ?? "—"} · {claim.currency}
                        </Text>
                      </View>
                      <Text style={styles.claimPickerArrow}>›</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              {isAddingToClaim ? (
                <View style={styles.claimPickerLoading}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.claimPickerLoadingText}>Adding to claim…</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Sector filter sheet */}
      <TngFilterSheet
        isVisible={sectorSheetOpen}
        onClose={() => setSectorSheetOpen(false)}
        onSelect={(v) => { setFilters(f => ({ ...f, sector: v })); setSectorSheetOpen(false); }}
        options={sectorOptions}
        selectedValue={filters.sector ?? "ALL"}
        title="Transaction Type"
      />

      {/* Status filter sheet */}
      <TngFilterSheet
        isVisible={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        onSelect={(v) => { setFilters(f => ({ ...f, claimed: v })); setStatusSheetOpen(false); }}
        options={statusOptions}
        selectedValue={filters.claimed ?? "all"}
        title="Status"
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
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [statementMeta, setStatementMeta] = useState<string | null>(null);

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
    setIsParsing(false);
    setParseError(null);
    setStatementMeta(null);
  }

  async function parsePdf(uri: string, name: string, mimeType: string) {
    const baseUrl = getSyncBaseUrl();
    setFileName(name);
    setIsParsing(true);
    setParseError(null);
    setRows([]);

    try {
      let json: {
        rows?: BackendRow[];
        statement_label?: string;
        meta?: { account_name?: string; period?: string };
        error?: { message?: string };
      };

      if (Platform.OS === "web") {
        // Web: blob URL → File → multipart fetch
        const blob = await fetch(uri).then((r) => r.blob());
        const formData = new FormData();
        formData.append("file", new File([blob], name, { type: mimeType || "application/pdf" }));
        const res = await fetch(`${baseUrl}/api/tng/parse`, {
          method: "POST",
          body: formData,
        });
        json = await res.json();
        if (!res.ok) {
          setParseError(json.error?.message ?? `Parse failed (${res.status}).`);
          return;
        }
      } else {
        // Native: use XMLHttpRequest with {uri, name, type} FormData —
        // XHR handles file:// URIs from DocumentPicker natively in React Native
        // without going through expo-file-system (which can't read picker cache).
        const session = useAuthStore.getState().session;
        const endpoint = `${baseUrl}/api/tng/parse`;

        const xhrBody = await new Promise<typeof json>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", endpoint);
          if (session?.accessToken) {
            xhr.setRequestHeader("Authorization", `Bearer ${session.accessToken}`);
          }
          xhr.onload = () => {
            try {
              const parsed = JSON.parse(xhr.responseText) as typeof json;
              if (xhr.status >= 400) {
                reject(new Error(`HTTP ${xhr.status}: ${parsed.error?.message ?? xhr.responseText.slice(0, 200)}`));
              } else {
                resolve(parsed);
              }
            } catch {
              reject(new Error(`HTTP ${xhr.status} — bad JSON: ${xhr.responseText.slice(0, 200)}`));
            }
          };
          xhr.onerror = () => reject(new Error(`XHR network error (readyState=${xhr.readyState} status=${xhr.status}) — URL: ${endpoint}`));
          xhr.ontimeout = () => reject(new Error("Request timed out after 2 min."));
          xhr.timeout = 120_000; // 2 min for large PDFs

          const formData = new FormData();
          // React Native XHR natively reads file:// URIs via this object format
          formData.append("file", { uri, name, type: mimeType || "application/pdf" } as unknown as Blob);
          xhr.send(formData);
        });

        json = xhrBody;
        if (json.error) {
          setParseError(json.error.message ?? "Parse failed.");
          return;
        }
      }

      if (!json) {
        setParseError("Empty response from server.");
        return;
      }

      const parsed = mapBackendRows(json.rows ?? []);
      if (parsed.length === 0) {
        setParseError("No transactions found in this statement. Make sure it is a TNG Customer Transactions Statement PDF.");
        return;
      }

      setRows(parsed.map((r, i) => ({ ...r, id: `${name}-${i}`, selected: true })));
      if (json.statement_label) {
        setLabel(json.statement_label);
        setStatementMeta(
          json.meta?.account_name
            ? `${json.statement_label} · ${json.meta.account_name}`
            : json.statement_label
        );
      }
    } catch (e) {
      // Show full error detail on screen so it can be read from the device
      const msg = e instanceof Error
        ? `${e.name}: ${e.message}`
        : String(e);
      console.error("[TNG parsePdf]", msg);
      setParseError(msg);
    } finally {
      setIsParsing(false);
    }
  }

  async function chooseFile() {
    if (Platform.OS !== "web") {
      // Native: use expo-document-picker
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
        });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        await parsePdf(asset.uri, asset.name, asset.mimeType ?? "application/pdf");
      } catch (e) {
        setParseError(e instanceof Error ? e.message : "Could not open file picker.");
      }
      return;
    }

    // Web: file input → blob URL
    const documentRef = (globalThis as typeof globalThis & { document?: Document }).document;
    if (!documentRef) return;

    const input = documentRef.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
    input.style.display = "none";
    input.onchange = async () => {
      const file = input.files?.[0] ?? null;
      input.remove();
      if (!file) return;
      const blobUrl = URL.createObjectURL(file);
      await parsePdf(blobUrl, file.name, file.type);
      URL.revokeObjectURL(blobUrl);
    };
    documentRef.body.appendChild(input);
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
                Select your TNG Customer Transactions Statement PDF to import toll, parking and retail rows.
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" style={styles.modalScroll}>

            {/* Statement label — auto-filled from parse, user can edit */}
            <View style={styles.field}>
              <Text style={styles.label}>Statement Label</Text>
              <TextInput
                onChangeText={setLabel}
                placeholder="e.g. May 2026 TNG"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={label}
              />
            </View>

            {/* File picker */}
            <Pressable
              accessibilityRole="button"
              disabled={isParsing}
              onPress={() => void chooseFile()}
              style={[styles.filePicker, isParsing ? styles.disabled : null]}
            >
              <View style={styles.fileIcon}>
                <Text style={styles.fileIconText}>PDF</Text>
              </View>
              <View style={styles.filePickerCopy}>
                <Text style={styles.filePickerTitle}>
                  {isParsing ? "Parsing…" : fileName ?? "Select TNG Statement PDF"}
                </Text>
                <Text style={styles.filePickerSub}>
                  TNG app → History → Export → Customer Transactions Statement
                </Text>
              </View>
              <Text style={styles.fileArrow}>›</Text>
            </Pressable>

            {/* Parsing indicator */}
            {isParsing ? (
              <View style={styles.parsingBox}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.parsingText}>Reading PDF, please wait…</Text>
              </View>
            ) : null}

            {/* Parse error */}
            {parseError && !isParsing ? (
              <View style={styles.parseErrorBox}>
                <Text style={styles.parseErrorLabel}>Error</Text>
                <TextInput
                  editable={false}
                  multiline
                  selectTextOnFocus
                  style={styles.parseErrorText}
                  value={parseError}
                />
                <View style={styles.parseErrorActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => Clipboard.setString(parseError)}
                    style={styles.copyErrorButton}
                  >
                    <Text style={styles.copyErrorText}>📋 Copy Error</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => { setParseError(null); setFileName(null); }}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* Statement meta info */}
            {statementMeta && rows.length > 0 ? (
              <View style={styles.statementMeta}>
                <Text style={styles.statementMetaText}>📋 {statementMeta}</Text>
              </View>
            ) : null}

            {/* Preview rows */}
            {rows.length > 0 && !isParsing ? (
              <View style={styles.previewBox}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>
                    {rows.length} transaction{rows.length !== 1 ? "s" : ""} found
                  </Text>
                  <Text style={styles.previewTotal}>
                    {selectedRows.length} selected · {formatMoney(selectedTotal)}
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
                    <Text style={styles.checkbox}>{row.selected ? "✓" : ""}</Text>
                    <View style={styles.previewMain}>
                      <Text style={styles.previewName}>
                        {sectorIcon(row.sector)} {locationLabel({ ...row, location: row.location ?? null, entryLocation: row.entryLocation ?? null, exitLocation: row.exitLocation ?? null } as TngTransaction)}
                      </Text>
                      <Text style={styles.previewMeta}>
                        {formatDate(row.transactionDate)}
                        {row.transNo ? ` · #${row.transNo}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.previewAmount}>
                      {formatMoney(row.amountCents)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
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

function BatchRow({
  batch,
  isDeleting,
  onDelete
}: {
  batch: TngStatementBatch;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <View style={styles.batchRow}>
      <View style={styles.batchRowBody}>
        <Text numberOfLines={1} style={styles.batchTitle}>{compactBatchLabel(batch.label)}</Text>
        <Text style={styles.batchMeta}>
          {batch.transactionCount} rows · {formatDate(batch.importedAt)} · {formatMoney(batch.totalAmountCents)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={isDeleting}
        onPress={onDelete}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>🗑</Text>
      </Pressable>
    </View>
  );
}

function TngFilterSheet<T extends string>({
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
  if (!isVisible) return null;
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.filterSheet}>
          <View style={styles.filterSheetHeader}>
            <Text style={styles.filterSheetTitle}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>
          {options.map((opt) => {
            const active = opt.value === selectedValue;
            return (
              <Pressable
                accessibilityRole="button"
                key={opt.value}
                onPress={() => onSelect(opt.value)}
                style={[styles.filterSheetRow, active ? styles.filterSheetRowActive : null]}
              >
                <Text style={[styles.filterSheetRowText, active ? styles.filterSheetRowTextActive : null]}>
                  {opt.label}
                </Text>
                {active ? <Text style={styles.filterSheetCheck}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

function TransactionRow({
  onAddToClaim,
  transaction
}: {
  onAddToClaim?: () => void;
  transaction: TngTransaction;
}) {
  return (
    <View style={styles.transactionRow}>
      <View style={[
        styles.sectorBadge,
        transaction.sector === "TOLL" ? styles.sectorBadgeToll
        : transaction.sector === "PARKING" ? styles.sectorBadgeParking
        : styles.sectorBadgeRetail
      ]}>
        <Text style={styles.sectorBadgeText}>{sectorIcon(transaction.sector)}</Text>
      </View>
      <View style={styles.transactionMain}>
        <Text style={styles.transactionTitle} numberOfLines={1}>
          {locationLabel(transaction)}
        </Text>
        <Text style={styles.transactionMeta}>
          {formatDate(transaction.transactionDate)} · {transaction.statementLabel ? compactBatchLabel(transaction.statementLabel) : "TNG"}
        </Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>
          {formatMoney(transaction.amountCents)}
        </Text>
        {transaction.claimed ? (
          <Text style={[styles.transactionStatus, styles.statusClaimed]}>✓ Claimed</Text>
        ) : onAddToClaim ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAddToClaim}
            style={styles.addToClaimBtn}
          >
            <Text style={styles.addToClaimText}>+ Claim</Text>
          </Pressable>
        ) : (
          <Text style={[styles.transactionStatus, styles.statusOpen]}>Open</Text>
        )}
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

const MONTH_SHORT: Record<string, string> = {
  January: "Jan", February: "Feb", March: "Mar", April: "Apr",
  May: "May", June: "Jun", July: "Jul", August: "Aug",
  September: "Sep", October: "Oct", November: "Nov", December: "Dec"
};

/**
 * Compresses TNG date-range labels for compact display.
 * "06 March 2026 - 04 June 2026"  →  "6 Mar – 4 Jun '26"
 * Different years: "6 Dec '25 – 4 Jan '26"
 * Unrecognised format falls back to the raw label unchanged.
 */
function compactBatchLabel(label: string): string {
  const m = label.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/
  );
  if (!m) return label;
  const [, d1, mon1, y1, d2, mon2, y2] = m;
  const s1 = MONTH_SHORT[mon1] ?? mon1.slice(0, 3);
  const s2 = MONTH_SHORT[mon2] ?? mon2.slice(0, 3);
  if (y1 === y2) {
    return `${Number(d1)} ${s1} – ${Number(d2)} ${s2} '${y1.slice(2)}`;
  }
  return `${Number(d1)} ${s1} '${y1.slice(2)} – ${Number(d2)} ${s2} '${y2.slice(2)}`;
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

function sectorIcon(sector: TngSector) {
  if (sector === "TOLL") return "🛣";
  if (sector === "PARKING") return "🅿";
  return "🛒";
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

function emptyStateTitle(filters: TngTransactionFilters) {
  if (isUnfiltered(filters)) {
    return "No TNG rows yet";
  }

  if (filters.claimed === "claimed") {
    return "No claimed TNG rows";
  }

  if (filters.claimed === "unclaimed") {
    return "No open TNG rows";
  }

  return `No ${sectorLabel(filters.sector ?? "ALL")} rows`;
}

function emptyStateCopy(filters: TngTransactionFilters) {
  if (isUnfiltered(filters)) {
    return "Import a statement preview to build the local transaction library.";
  }

  return "Change the filters to view other imported transactions.";
}

function isUnfiltered(filters: TngTransactionFilters) {
  return (filters.sector ?? "ALL") === "ALL" && (filters.claimed ?? "all") === "all";
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  importButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: spacing.md
  },
  importButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  // ── Stats bar ──
  statsBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  statItem: {
    flexDirection: "row"
  } as const,
  statNum: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  statSep: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  statDot: {
    color: colors.muted,
    fontSize: typography.caption
  },
  // ── Statements accordion ──
  statementsAccordion: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden"
  },
  statementsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  statementsHeaderText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  statementsChevron: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "900"
  },
  statementsBody: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1
  },
  batchRow: {
    alignItems: "center",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  batchRowBody: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  batchTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  batchMeta: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  deleteButtonText: {
    fontSize: 14
  },
  // ── Filter bar ──
  filterBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  filterBarLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  filterBarActions: {
    flexDirection: "row",
    gap: 6
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: spacing.md
  },
  filterChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900"
  },
  // ── Filter sheet ──
  filterSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 360,
    padding: spacing.md,
    width: "100%"
  },
  filterSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1
  },
  filterSheetTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  filterSheetRow: {
    alignItems: "center",
    borderRadius: 10,
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: spacing.sm
  },
  filterSheetRowActive: {
    backgroundColor: "#f1f5f9"
  },
  filterSheetRowText: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700"
  },
  filterSheetRowTextActive: {
    color: colors.primary,
    fontWeight: "900"
  },
  filterSheetCheck: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  list: {
    gap: spacing.sm
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: 90
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
    flex: 1,
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
  modalScroll: {
    flex: 1
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
  parsingBox: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  parsingText: {
    color: "#0369a1",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  parseErrorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  parseErrorLabel: {
    color: "#b91c1c",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  parseErrorText: {
    color: "#b91c1c",
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    minHeight: 0
  },
  parseErrorActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  copyErrorButton: {
    backgroundColor: colors.surface,
    borderColor: "#fecaca",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6
  },
  copyErrorText: {
    color: "#b91c1c",
    fontSize: 11,
    fontWeight: "900"
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderColor: "#fecaca",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6
  },
  retryButtonText: {
    color: "#b91c1c",
    fontSize: 11,
    fontWeight: "900"
  },
  statementMeta: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.sm
  },
  statementMetaText: {
    color: "#0369a1",
    fontSize: typography.caption,
    fontWeight: "700"
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
  },
  sectorBadgeToll: {
    backgroundColor: "#f0fdf4"
  },
  sectorBadgeParking: {
    backgroundColor: "#eff6ff"
  },
  sectorBadgeRetail: {
    backgroundColor: "#fefce8"
  },
  addToClaimBtn: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  addToClaimText: {
    color: "#1d4ed8",
    fontSize: 10,
    fontWeight: "900"
  },
  // ── Claim picker modal ──────────────────────────────────────────────────
  claimPickerSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: "70%",
    maxWidth: 520,
    overflow: "hidden",
    width: "100%"
  },
  claimPickerHeader: {
    alignItems: "center",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  claimPickerHeaderBody: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  claimPickerTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  claimPickerSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  claimPickerScroll: {
    maxHeight: 360
  },
  claimPickerEmpty: {
    alignItems: "center",
    padding: spacing.xl
  },
  claimPickerEmptyText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center"
  },
  claimPickerRow: {
    alignItems: "center",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  claimPickerRowBody: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  claimPickerRowTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  claimPickerRowSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  claimPickerArrow: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "800"
  },
  claimPickerLoading: {
    alignItems: "center",
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.md
  },
  claimPickerLoadingText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  closeButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "900"
  }
});
