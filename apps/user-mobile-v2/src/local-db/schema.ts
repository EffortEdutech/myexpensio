export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY NOT NULL,
    merchant_name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    expense_date TEXT NOT NULL,
    notes TEXT,
    sync_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    deleted_at TEXT,
    device_id TEXT NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_updated_at
    ON expenses (updated_at);`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_sync_status
    ON expenses (sync_status);`,
  `CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    sync_status TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_error TEXT
  );`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_status_created_at
    ON sync_queue (sync_status, created_at);`
] as const;

