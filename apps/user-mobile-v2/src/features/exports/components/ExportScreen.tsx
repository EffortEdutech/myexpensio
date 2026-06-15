import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { Platform } from "react-native";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { SignatureModal } from "@/features/exports/components/SignatureModal";

import type { ClaimDraft } from "@/features/claims/types";
import { buildLocalPdf } from "@/features/exports/buildLocalPdf";
import { buildLocalXlsx } from "@/features/exports/buildLocalXlsx";
import { downloadCsvExport } from "@/features/exports/exportFiles";
import { useCreateLocalExportJob } from "@/features/exports/hooks/useExportActions";
import {
  useExportJobs,
  useExportPreview,
  useExportUsageSummary
} from "@/features/exports/hooks/useExports";
import type { ExportFormat, ExportJob } from "@/features/exports/types";
import { canUseFeature } from "@/features/subscription/featureGates";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { useAuthStore } from "@/state/authStore";
import { colors, spacing, typography } from "@/theme/tokens";

type ExportScreenProps = {
  claims: ClaimDraft[];
  isLoadingClaims: boolean;
};

export function ExportScreen({ claims, isLoadingClaims }: ExportScreenProps) {
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat>("CSV");
  const [pdfLayout, setPdfLayout] = useState<"BY_DATE" | "BY_CATEGORY">("BY_DATE");
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const exportJobs = useExportJobs();
  const usage = useExportUsageSummary();
  const preview = useExportPreview(selectedClaimIds);
  const createExport = useCreateLocalExportJob();
  const { tier } = useSubscription();
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const canExportPdf = canUseFeature(tier, "exports_pdf");
  const selectableClaims = useMemo(
    () => claims.filter((claim) => claim.deletedAt === null),
    [claims]
  );
  const selectedSet = useMemo(
    () => new Set(selectedClaimIds),
    [selectedClaimIds]
  );
  const limitReached =
    usage.data?.limit != null &&
    usage.data.exportsCreated >= usage.data.limit;
  const primaryActionDisabled =
    selectedClaimIds.length === 0 ||
    createExport.isPending ||
    pdfGenerating ||
    limitReached ||
    (format === "PDF" && !canExportPdf);

  function toggleClaim(claimId: string) {
    setSelectedClaimIds((current) =>
      current.includes(claimId)
        ? current.filter((id) => id !== claimId)
        : [...current, claimId]
    );
  }

  async function handleGenerateExport() {
    setDownloadNotice(null);

    try {
      if (format === "PDF") {
        await handleGeneratePdf();
        return;
      }

      if (format === "XLSX") {
        await handleGenerateXlsx();
        return;
      }

      const job = await createExport.mutateAsync({
        claimIds: selectedClaimIds,
        format,
        templateName: "Standard claim export"
      });

      if (!job.previewPayload) {
        throw new Error("Export payload was not created.");
      }

      downloadCsvExport(job.previewPayload);
      setDownloadNotice("CSV file generated and downloaded.");
    } catch (error) {
      setDownloadNotice(error instanceof Error ? error.message : "Export failed.");
    }
  }

  async function handleGeneratePdf() {
    if (!preview.data?.payload) {
      setDownloadNotice("No export data available. Select at least one claim.");
      return;
    }
    setPdfGenerating(true);
    setDownloadNotice(null);
    try {
      const result = await buildLocalPdf(
        preview.data.payload,
        preview.data.appendices,
        { claimerName: "Claimant", pdfLayout, signatureDataUrl },
        accessToken
      );

      if (Platform.OS === "web") {
        setDownloadNotice("PDF downloaded — check your browser's downloads.");
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        setDownloadNotice(`PDF saved: ${result.uri}`);
        return;
      }

      await Sharing.shareAsync(result.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Save or share your expense claim PDF",
        UTI: "com.adobe.pdf"
      });

      setDownloadNotice("PDF ready — tap to save or share.");
    } catch (error) {
      setDownloadNotice(error instanceof Error ? error.message : "PDF generation failed.");
    } finally {
      setPdfGenerating(false);
    }
  }

  async function handleGenerateXlsx() {
    if (!preview.data?.payload) {
      setDownloadNotice("No export data available. Select at least one claim.");
      return;
    }
    setPdfGenerating(true);
    setDownloadNotice(null);
    try {
      const result = await buildLocalXlsx(preview.data.payload, accessToken);

      if (Platform.OS === "web") {
        setDownloadNotice("XLSX downloaded — check your browser's downloads.");
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        setDownloadNotice(`XLSX saved: ${result.uri}`);
        return;
      }
      await Sharing.shareAsync(result.uri, {
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Save or share your expense claim XLSX",
      });
      setDownloadNotice("XLSX ready — tap to save or share.");
    } catch (error) {
      setDownloadNotice(error instanceof Error ? error.message : "XLSX generation failed.");
    } finally {
      setPdfGenerating(false);
    }
  }

  function handleDownloadHistory(job: ExportJob) {
    try {
      if (!job.previewPayload || job.format !== "CSV") {
        setDownloadNotice("Only completed CSV exports can be downloaded locally.");
        return;
      }

      downloadCsvExport(job.previewPayload);
      setDownloadNotice("CSV file downloaded again from export history.");
    } catch (error) {
      setDownloadNotice(error instanceof Error ? error.message : "Download failed.");
    }
  }

  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.page}>
      {/* Header — title only, no subtitle */}
      <View style={styles.header}>
        <Text style={styles.title}>Exports</Text>
      </View>

      {/* Compact stats bar */}
      <View style={styles.statsBar}>
        <Text style={styles.statItem}>
          <Text style={styles.statNum}>{selectedClaimIds.length}</Text>
          <Text style={styles.statSep}> selected</Text>
        </Text>
        {selectedClaimIds.length > 0 ? (
          <>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statItem}>
              <Text style={styles.statNum}>{preview.data?.rowCount ?? 0}</Text>
              <Text style={styles.statSep}> rows</Text>
            </Text>
            <Text style={styles.statDot}>·</Text>
            <Text style={styles.statNum}>{formatMoney(preview.data?.totalAmountCents ?? 0)}</Text>
          </>
        ) : null}
      </View>

      <UsageCard
        exportsCreated={usage.data?.exportsCreated ?? 0}
        limit={usage.data?.limit ?? null}
        periodEnd={usage.data?.periodEnd ?? ""}
        tier={tier}
      />

      {limitReached ? (
        <View style={styles.limitNotice}>
          <Text style={styles.limitNoticeTitle}>Export limit reached</Text>
          <Text style={styles.limitNoticeCopy}>
            This trial workspace has used its local CSV exports for the current month. Final paid-plan limits will sync from the backend later.
          </Text>
        </View>
      ) : null}

      <View style={styles.segmentGroup}>
        {(["CSV", "PDF", "XLSX"] as const).map((value) => (
          <Pressable
            accessibilityRole="button"
            key={value}
            onPress={() => setFormat(value)}
            style={[styles.segment, format === value ? styles.segmentActive : null]}
          >
            <Text
              style={[
                styles.segmentText,
                format === value ? styles.segmentTextActive : null
              ]}
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>

      {format === "PDF" && canExportPdf ? (
        <View style={styles.layoutRow}>
          <Text style={styles.layoutLabel}>Group by</Text>
          <View style={styles.layoutToggle}>
            {(["BY_DATE", "BY_CATEGORY"] as const).map((value) => (
              <Pressable
                accessibilityRole="button"
                key={value}
                onPress={() => setPdfLayout(value)}
                style={[styles.segment, pdfLayout === value ? styles.segmentActive : null]}
              >
                <Text style={[styles.segmentText, pdfLayout === value ? styles.segmentTextActive : null]}>
                  {value === "BY_DATE" ? "Date" : "Category"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {format === "PDF" && canExportPdf ? (
        <View style={styles.signatureSection}>
          <Text style={styles.layoutLabel}>Signature</Text>
          {signatureDataUrl ? (
            <View style={styles.signaturePreview}>
              <Image
                source={{ uri: signatureDataUrl }}
                style={styles.signatureImage}
                resizeMode="contain"
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setSignatureDataUrl(null)}
                style={styles.signatureClear}
              >
                <Text style={styles.signatureClearText}>Clear</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSignatureModalOpen(true)}
              style={styles.signatureButton}
            >
              <Text style={styles.signatureButtonText}>+ Add Signature</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      <SignatureModal
        visible={signatureModalOpen}
        onConfirm={(dataUrl) => setSignatureDataUrl(dataUrl)}
        onClose={() => setSignatureModalOpen(false)}
      />

      {format === "PDF" && !canExportPdf ? (
        <View style={styles.proNotice}>
          <Text style={styles.proNoticeTitle}>PRO feature</Text>
          <Text style={styles.proNoticeCopy}>
            On-device PDF export with TNG statement highlighting is available on PRO and PREMIUM plans.
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Claims</Text>
        {isLoadingClaims ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : selectableClaims.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No claims available</Text>
            <Text style={styles.emptyCopy}>
              Create or submit claims before preparing an export preview.
            </Text>
          </View>
        ) : (
          <View style={styles.claimList}>
            {selectableClaims.map((claim) => (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selectedSet.has(claim.id) }}
                key={claim.id}
                onPress={() => toggleClaim(claim.id)}
                style={[
                  styles.claimRow,
                  selectedSet.has(claim.id) ? styles.claimRowSelected : null
                ]}
              >
                <Text style={styles.checkbox}>
                  {selectedSet.has(claim.id) ? "x" : ""}
                </Text>
                <View style={styles.claimMain}>
                  <Text style={styles.claimTitle}>
                    {claim.title || periodLabel(claim)}
                  </Text>
                  <Text style={styles.claimMeta}>
                    {claim.status} - {periodLabel(claim)}
                  </Text>
                </View>
                <Text style={styles.claimAmount}>
                  {formatMoney(claim.totalAmountCents)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {selectedClaimIds.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          {preview.isLoading ? (
            <View style={styles.previewBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>Standard claim export</Text>
              <Text style={styles.previewCopy}>
                {preview.data?.payload.rows.length ?? 0} item rows across {preview.data?.payload.claims.length ?? 0} claim(s).
              </Text>
              <View style={styles.previewRows}>
                {(preview.data?.payload.rows ?? []).slice(0, 4).map((row) => (
                  <View key={row.itemId} style={styles.previewRow}>
                    <View style={styles.previewRowMain}>
                      <Text style={styles.previewRowTitle}>{row.title}</Text>
                      <Text style={styles.previewRowSub}>
                        {row.itemType} - {formatDate(row.itemDate)}
                      </Text>
                    </View>
                    <Text style={styles.previewRowAmount}>
                      {formatMoney(row.amountCents)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      ) : null}

      {preview.data?.appendices.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appendix B - TNG</Text>
          <View style={styles.appendixBox}>
            {preview.data.appendices.map((appendix) => (
              <View key={appendix.uploadBatchId ?? appendix.statementLabel} style={styles.appendixRow}>
                <View style={styles.appendixMain}>
                  <Text style={styles.appendixTitle}>{appendix.statementLabel}</Text>
                  <Text style={styles.appendixSub}>
                    {appendix.transactionCount} linked row(s) - {appendix.hasSourcePdf ? "PDF available" : "PDF pending"}
                  </Text>
                </View>
                <Text style={styles.appendixAmount}>
                  {formatMoney(appendix.totalAmountCents)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={primaryActionDisabled}
        onPress={() => void handleGenerateExport()}
        style={[
          styles.generateButton,
          primaryActionDisabled ? styles.disabled : null
        ]}
      >
        <Text style={styles.generateText}>
          {format === "PDF" && !canExportPdf
            ? "PRO Required — Upgrade to Export PDF"
            : limitReached
              ? "Export Limit Reached"
              : pdfGenerating
                ? format === "XLSX" ? "Generating XLSX…" : "Generating PDF…"
                : createExport.isPending
                  ? "Generating CSV…"
                  : format === "PDF"
                    ? "Generate PDF"
                    : format === "XLSX"
                      ? "Download XLSX"
                      : "Download CSV"}
        </Text>
      </Pressable>

      {downloadNotice ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{downloadNotice}</Text>
        </View>
      ) : null}

      {createExport.error instanceof Error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{createExport.error.message}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export History</Text>
        {exportJobs.isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : exportJobs.data && exportJobs.data.length > 0 ? (
          <View style={styles.historyList}>
            {exportJobs.data.map((job) => (
              <ExportJobRow
                key={job.id}
                job={job}
                onDownloadCsv={handleDownloadHistory}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No export previews yet</Text>
            <Text style={styles.emptyCopy}>
              Download a CSV export to create the first export history entry.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ExportJobRow({
  job,
  onDownloadCsv
}: {
  job: ExportJob;
  onDownloadCsv: (job: ExportJob) => void;
}) {
  const canDownloadCsv = job.format === "CSV" && job.previewPayload !== null;

  return (
    <View style={styles.historyRow}>
      <View style={styles.historyMain}>
        <Text style={styles.historyTitle}>
          {job.format} {canDownloadCsv ? "file" : "preview"}
        </Text>
        <Text style={styles.historySub}>
          {formatDate(job.createdAt)} - {job.rowCount} row(s) - {job.status}
        </Text>
      </View>
      <Text style={styles.historyAmount}>{formatMoney(job.totalAmountCents)}</Text>
      {canDownloadCsv ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => onDownloadCsv(job)}
          style={styles.historyButton}
        >
          <Text style={styles.historyButtonText}>Download</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function UsageCard({
  exportsCreated,
  limit,
  periodEnd,
  tier
}: {
  exportsCreated: number;
  limit: number | null;
  periodEnd: string;
  tier: string;
}) {
  const remaining = limit == null ? null : Math.max(0, limit - exportsCreated);
  const tierLabel = tier === "PREMIUM" ? "Premium" : tier === "PRO" ? "Pro" : "Free";
  const csvNote = tier === "FREE"
    ? "CSV only. Upgrade to PRO or PREMIUM to unlock PDF export."
    : "CSV (local) · PDF on-device · TNG highlights via scan service.";

  return (
    <View style={styles.usageCard}>
      <View style={styles.usageMain}>
        <Text style={styles.usageTitle}>{tierLabel} plan</Text>
        <Text style={styles.usageCopy}>{csvNote}</Text>
      </View>
      <View style={styles.usageRight}>
        <Text style={styles.usageMetric}>
          {limit == null ? "Unlimited" : `${exportsCreated}/${limit}`}
        </Text>
        <Text style={styles.usageSub}>
          {remaining == null ? "CSV exports" : `${remaining} left`}
          {periodEnd && remaining != null ? ` until ${formatDate(periodEnd)}` : ""}
        </Text>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function periodLabel(claim: ClaimDraft) {
  if (claim.periodStart && claim.periodEnd) {
    if (claim.periodStart === claim.periodEnd) {
      return formatDate(claim.periodStart);
    }

    return `${formatDate(claim.periodStart)} - ${formatDate(claim.periodEnd)}`;
  }

  return formatDate(claim.periodStart ?? claim.periodEnd ?? claim.createdAt);
}

function formatMoney(amountCents: number) {
  return `MYR ${(amountCents / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

const styles = StyleSheet.create({
  pageScroll: {
    flex: 1
  },
  page: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
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
  usageCard: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  usageMain: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  usageTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  usageCopy: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  usageRight: {
    alignItems: "flex-end",
    gap: 2
  },
  usageMetric: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "900"
  },
  usageSub: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "right"
  },
  limitNotice: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: spacing.md
  },
  limitNoticeTitle: {
    color: "#c2410c",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  limitNoticeCopy: {
    color: "#9a3412",
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  proNotice: {
    backgroundColor: "#fdf4ff",
    borderColor: "#e9d5ff",
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: spacing.md
  },
  proNoticeTitle: {
    color: "#6b21a8",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  proNoticeCopy: {
    color: "#7e22ce",
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  backendNotice: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: spacing.md
  },
  backendNoticeTitle: {
    color: "#1e3a8a",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  backendNoticeCopy: {
    color: "#2563eb",
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  segmentGroup: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    padding: 4
  },
  layoutRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  layoutLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "900",
    width: 60
  },
  layoutToggle: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    flex: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4
  },
  segment: {
    alignItems: "center",
    borderRadius: 7,
    flex: 1,
    justifyContent: "center",
    minHeight: 38
  },
  segmentActive: {
    backgroundColor: colors.primary
  },
  segmentText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "900"
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
  claimList: {
    gap: spacing.sm
  },
  claimRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    padding: spacing.md
  },
  claimRowSelected: {
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
  claimMain: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  claimTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  claimMeta: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  claimAmount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  previewBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  previewTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  previewCopy: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  previewRows: {
    gap: spacing.xs
  },
  previewRow: {
    alignItems: "center",
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.sm
  },
  previewRowMain: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  previewRowTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  previewRowSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  previewRowAmount: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  appendixBox: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  appendixRow: {
    alignItems: "center",
    borderBottomColor: "#dbeafe",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.md
  },
  appendixMain: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  appendixTitle: {
    color: "#1e3a8a",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  appendixSub: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: "700"
  },
  appendixAmount: {
    color: "#1e3a8a",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  generateButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 48
  },
  generateText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "900"
  },
  historyList: {
    gap: spacing.sm
  },
  historyRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    padding: spacing.md
  },
  historyMain: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  historyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  historySub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  historyAmount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  historyButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: spacing.md
  },
  historyButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    minHeight: 150,
    justifyContent: "center",
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
  successBox: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  successText: {
    color: "#15803d",
    fontSize: typography.caption,
    fontWeight: "800"
  },
  signatureSection: {
    gap: spacing.xs
  },
  signatureButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    padding: spacing.md
  },
  signatureButtonText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  signaturePreview: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: "#86efac",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.sm
  },
  signatureImage: {
    flex: 1,
    height: 48
  },
  signatureClear: {
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  signatureClearText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  disabled: {
    opacity: 0.45
  }
});
