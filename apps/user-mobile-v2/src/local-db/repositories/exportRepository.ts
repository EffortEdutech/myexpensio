import type {
  CreateExportJobInput,
  ExportJob,
  ExportJobStatus,
  ExportPreviewClaim,
  ExportPreviewPayload,
  ExportPreviewRow,
  TngAppendixPreview
} from "@/features/exports/types";
import type { ExportFormat } from "@/features/exports/types";
import type { SyncStatus } from "@/features/expenses/types";
import { getDatabase } from "@/local-db/database";
import { enqueueSyncItem } from "@/local-db/repositories/syncQueueRepository";
import { createId } from "@/utils/ids";
import { nowIso } from "@/utils/time";

type ExportJobRow = {
  claim_ids: string;
  created_at: string;
  currency: string;
  deleted_at: string | null;
  device_id: string;
  filter_status: string | null;
  format: ExportFormat;
  id: string;
  local_uri: string | null;
  preview_payload: string | null;
  row_count: number;
  status: ExportJobStatus;
  sync_status: SyncStatus;
  template_name: string | null;
  tng_appendix_payload: string | null;
  total_amount_cents: number;
  updated_at: string;
};

type ClaimExportRow = {
  currency: string;
  id: string;
  period_end: string | null;
  period_start: string | null;
  status: string;
  title: string | null;
  total_amount_cents: number;
};

type ClaimItemExportRow = {
  amount_cents: number;
  claim_id: string;
  claim_title: string | null;
  currency: string;
  item_date: string;
  item_id: string;
  item_type: string;
  notes: string | null;
  receipt_id: string | null;
  title: string;
  tng_source_file_uri: string | null;
  tng_statement_label: string | null;
  tng_trans_no: string | null;
  tng_upload_batch_id: string | null;
};

const freeExportLimit = 3;

export async function listExportJobs() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ExportJobRow>(
    `SELECT *
      FROM export_jobs
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC;`
  );

  return rows.map(mapExportJobRow);
}

export async function getExportUsageSummary() {
  const database = await getDatabase();
  const period = currentPeriod();
  const row = await database.getFirstAsync<{ exports_created: number }>(
    `SELECT exports_created
      FROM usage_counters_cache
      WHERE id = ?;`,
    [period.id]
  );

  if (!row) {
    await database.runAsync(
      `INSERT INTO usage_counters_cache (
        id, routes_calls, trips_created, exports_created, period_start,
        sync_status, updated_at
      ) VALUES (?, 0, 0, 0, ?, 'pending', ?);`,
      [period.id, period.start, nowIso()]
    );
  }

  return {
    exportsCreated: row?.exports_created ?? 0,
    limit: freeExportLimit,
    periodEnd: period.end,
    periodStart: period.start,
    tier: "FREE" as const
  };
}

export async function buildExportPreview(claimIds: string[]) {
  const database = await getDatabase();
  const timestamp = nowIso();

  if (claimIds.length === 0) {
    return {
      appendices: [],
      payload: { claims: [], generatedAt: timestamp, rows: [] },
      rowCount: 0,
      totalAmountCents: 0
    };
  }

  const placeholders = claimIds.map(() => "?").join(", ");
  const claimRows = await database.getAllAsync<ClaimExportRow>(
    `SELECT id, title, status, period_start, period_end, total_amount_cents, currency
      FROM claims
      WHERE id IN (${placeholders})
        AND deleted_at IS NULL
      ORDER BY created_at DESC;`,
    claimIds
  );
  const itemRows = await database.getAllAsync<ClaimItemExportRow>(
    `SELECT
        claim_items.id AS item_id,
        claim_items.claim_id,
        claims.title AS claim_title,
        claim_items.type AS item_type,
        claim_items.title,
        claim_items.amount_cents,
        claim_items.currency,
        claim_items.item_date,
        claim_items.notes,
        claim_items.receipt_id,
        tng_transactions.trans_no AS tng_trans_no,
        tng_transactions.statement_label AS tng_statement_label,
        tng_transactions.upload_batch_id AS tng_upload_batch_id,
        tng_transactions.source_file_uri AS tng_source_file_uri
      FROM claim_items
      JOIN claims ON claims.id = claim_items.claim_id
      LEFT JOIN tng_transactions ON tng_transactions.id = claim_items.tng_transaction_id
      WHERE claim_items.claim_id IN (${placeholders})
        AND claim_items.deleted_at IS NULL
      ORDER BY claim_items.item_date ASC, claim_items.created_at ASC;`,
    claimIds
  );
  const claims: ExportPreviewClaim[] = claimRows.map((claim) => ({
    currency: claim.currency,
    id: claim.id,
    itemCount: itemRows.filter((item) => item.claim_id === claim.id).length,
    periodEnd: claim.period_end,
    periodStart: claim.period_start,
    status: claim.status,
    title: claim.title,
    totalAmountCents: claim.total_amount_cents
  }));
  const rows: ExportPreviewRow[] = itemRows.map((item) => ({
    amountCents: item.amount_cents,
    claimId: item.claim_id,
    claimTitle: item.claim_title ?? "Untitled claim",
    currency: item.currency,
    itemDate: item.item_date,
    itemId: item.item_id,
    itemType: item.item_type,
    notes: item.notes,
    paidViaTng: Boolean(item.tng_trans_no),
    receiptPresent: Boolean(item.receipt_id),
    title: item.title,
    tngTransNo: item.tng_trans_no
  }));
  const appendices = buildTngAppendixPreview(itemRows);

  return {
    appendices,
    payload: {
      claims,
      generatedAt: timestamp,
      rows
    },
    rowCount: Math.max(rows.length, claims.length),
    totalAmountCents: claims.reduce(
      (sum, claim) => sum + claim.totalAmountCents,
      0
    )
  };
}

export async function createLocalExportJob(
  input: CreateExportJobInput,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const usage = await getExportUsageSummary();

  if (usage.limit !== null && usage.exportsCreated >= usage.limit) {
    throw new Error("Monthly export preview limit reached for this trial workspace.");
  }

  const preview = await buildExportPreview(input.claimIds);
  const job: ExportJob = {
    claimIds: input.claimIds,
    createdAt: timestamp,
    currency: "MYR",
    deletedAt: null,
    deviceId,
    filterStatus: null,
    format: input.format,
    id: createId("export_job"),
    localUri:
      input.format === "CSV"
        ? `download://exports/csv/${timestamp}`
        : `local://exports/${input.format.toLowerCase()}/${timestamp}`,
    previewPayload: preview.payload,
    rowCount: preview.rowCount,
    status: input.format === "CSV" ? "completed" : "local_preview",
    syncStatus: "pending",
    templateName: input.templateName ?? "Standard claim export",
    tngAppendixPayload: preview.appendices,
    totalAmountCents: preview.totalAmountCents,
    updatedAt: timestamp
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO export_jobs (
        id, format, status, claim_ids, row_count, total_amount_cents,
        currency, filter_status, template_name, preview_payload,
        tng_appendix_payload, local_uri, sync_status, created_at, updated_at,
        deleted_at, device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        job.id,
        job.format,
        job.status,
        JSON.stringify(job.claimIds),
        job.rowCount,
        job.totalAmountCents,
        job.currency,
        job.filterStatus,
        job.templateName,
        JSON.stringify(job.previewPayload),
        JSON.stringify(job.tngAppendixPayload),
        job.localUri,
        job.syncStatus,
        job.createdAt,
        job.updatedAt,
        job.deletedAt,
        job.deviceId
      ]
    );

    await database.runAsync(
      `UPDATE usage_counters_cache
        SET exports_created = exports_created + 1,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?;`,
      [timestamp, currentPeriod().id]
    );

    await enqueueSyncItem(
      {
        entityId: job.id,
        entityType: "export_job",
        operation: "create",
        payload: JSON.stringify(job)
      },
      database
    );
  });

  return job;
}

function buildTngAppendixPreview(rows: ClaimItemExportRow[]) {
  const groups = new Map<string, TngAppendixPreview>();

  for (const row of rows) {
    if (!row.tng_trans_no) {
      continue;
    }

    const key = row.tng_upload_batch_id ?? row.tng_statement_label ?? "unknown";
    const existing = groups.get(key);

    if (existing) {
      existing.totalAmountCents += row.amount_cents;
      existing.transactionCount += 1;
      existing.hasSourcePdf = existing.hasSourcePdf || Boolean(row.tng_source_file_uri);
      // Collect each linked item for the scan service highlight call
      existing.items.push({ transNo: row.tng_trans_no, amountCents: row.amount_cents });
      // Keep the first non-null sourceFileUri we encounter for this group
      if (!existing.sourceFileUri && row.tng_source_file_uri) {
        existing.sourceFileUri = row.tng_source_file_uri;
      }
      continue;
    }

    groups.set(key, {
      hasSourcePdf: Boolean(row.tng_source_file_uri),
      items: [{ transNo: row.tng_trans_no, amountCents: row.amount_cents }],
      sourceFileUri: row.tng_source_file_uri ?? null,
      statementLabel: row.tng_statement_label ?? "TNG statement",
      totalAmountCents: row.amount_cents,
      transactionCount: 1,
      uploadBatchId: row.tng_upload_batch_id
    });
  }

  return [...groups.values()];
}

function currentPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const periodStart = start.toISOString().slice(0, 10);

  return {
    end: end.toISOString().slice(0, 10),
    id: `usage_${periodStart}`,
    start: periodStart
  };
}

function mapExportJobRow(row: ExportJobRow): ExportJob {
  return {
    claimIds: parseJson<string[]>(row.claim_ids, []),
    createdAt: row.created_at,
    currency: row.currency,
    deletedAt: row.deleted_at,
    deviceId: row.device_id,
    filterStatus: row.filter_status,
    format: row.format,
    id: row.id,
    localUri: row.local_uri,
    previewPayload: parseJson<ExportPreviewPayload | null>(
      row.preview_payload,
      null
    ),
    rowCount: row.row_count,
    status: row.status,
    syncStatus: row.sync_status,
    templateName: row.template_name,
    tngAppendixPayload: parseJson<TngAppendixPreview[]>(
      row.tng_appendix_payload,
      []
    ),
    totalAmountCents: row.total_amount_cents,
    updatedAt: row.updated_at
  };
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
