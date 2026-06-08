export type LocalMigration = {
  id: number;
  name: string;
  statements: string[];
};

export const localMigrations: LocalMigration[] = [
  {
    id: 1,
    name: "core_sync_tables",
    statements: [
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS sync_state (
        scope TEXT PRIMARY KEY NOT NULL,
        cursor TEXT,
        last_synced_at TEXT,
        updated_at TEXT NOT NULL
      );`,
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
    ]
  },
  {
    id: 2,
    name: "user_context_cache",
    statements: [
      `CREATE TABLE IF NOT EXISTS profiles_cache (
        id TEXT PRIMARY KEY NOT NULL,
        email TEXT,
        display_name TEXT,
        department TEXT,
        location TEXT,
        company_name TEXT,
        sync_status TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS subscriptions_cache (
        id TEXT PRIMARY KEY NOT NULL,
        owner_type TEXT NOT NULL,
        owner_id TEXT NOT NULL,
        tier TEXT NOT NULL,
        status TEXT NOT NULL,
        current_period_end TEXT,
        seat_count INTEGER,
        sync_status TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS spaces (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        currency TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_spaces_type
        ON spaces (type);`
    ]
  },
  {
    id: 3,
    name: "claims_expenses_receipts",
    statements: [
      `CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY NOT NULL,
        space_id TEXT,
        title TEXT,
        status TEXT NOT NULL,
        period_start TEXT,
        period_end TEXT,
        total_amount_cents INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL,
        submitted_at TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_claims_status_updated_at
        ON claims (status, updated_at);`,
      `CREATE TABLE IF NOT EXISTS claim_items (
        id TEXT PRIMARY KEY NOT NULL,
        claim_id TEXT NOT NULL,
        type TEXT NOT NULL,
        mode TEXT,
        title TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        item_date TEXT NOT NULL,
        notes TEXT,
        receipt_id TEXT,
        trip_id TEXT,
        tng_transaction_id TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL,
        FOREIGN KEY (claim_id) REFERENCES claims (id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_claim_items_claim_id
        ON claim_items (claim_id);`,
      `CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        claim_id TEXT,
        space_id TEXT,
        merchant_name TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        expense_date TEXT NOT NULL,
        category TEXT,
        notes TEXT,
        receipt_id TEXT,
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
      `CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY NOT NULL,
        owner_entity_type TEXT NOT NULL,
        owner_entity_id TEXT NOT NULL,
        local_uri TEXT NOT NULL,
        remote_path TEXT,
        mime_type TEXT,
        file_size INTEGER,
        upload_status TEXT NOT NULL,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_receipts_owner
        ON receipts (owner_entity_type, owner_entity_id);`,
      `CREATE INDEX IF NOT EXISTS idx_receipts_upload_status
        ON receipts (upload_status);`
    ]
  },
  {
    id: 4,
    name: "trips_tng_ledger_reference",
    statements: [
      `CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY NOT NULL,
        claim_id TEXT,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        stopped_at TEXT,
        final_distance_m INTEGER,
        distance_source TEXT,
        vehicle_type TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS trip_points (
        id TEXT PRIMARY KEY NOT NULL,
        trip_id TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy_m REAL,
        captured_at TEXT NOT NULL,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        device_id TEXT NOT NULL,
        FOREIGN KEY (trip_id) REFERENCES trips (id)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_trip_points_trip_captured
        ON trip_points (trip_id, captured_at);`,
      `CREATE TABLE IF NOT EXISTS routes_cache (
        id TEXT PRIMARY KEY NOT NULL,
        cache_key TEXT NOT NULL,
        response_payload TEXT NOT NULL,
        expires_at TEXT,
        created_at TEXT NOT NULL
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_routes_cache_key
        ON routes_cache (cache_key);`,
      `CREATE TABLE IF NOT EXISTS tng_transactions (
        id TEXT PRIMARY KEY NOT NULL,
        statement_id TEXT,
        trans_no TEXT,
        sector TEXT,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        entry_location TEXT,
        exit_location TEXT,
        claimed INTEGER NOT NULL DEFAULT 0,
        claim_item_id TEXT,
        link_status TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_tng_transactions_claimed
        ON tng_transactions (claimed, transaction_date);`,
      `CREATE TABLE IF NOT EXISTS ledger_entries (
        id TEXT PRIMARY KEY NOT NULL,
        space_id TEXT NOT NULL,
        entry_type TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        category TEXT,
        tax_category TEXT,
        description TEXT,
        entry_date TEXT NOT NULL,
        is_tax_deductible INTEGER,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_ledger_entries_space_date
        ON ledger_entries (space_id, entry_date);`,
      `CREATE TABLE IF NOT EXISTS commitments (
        id TEXT PRIMARY KEY NOT NULL,
        space_id TEXT NOT NULL,
        title TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        due_day INTEGER,
        status TEXT NOT NULL,
        document_receipt_id TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS commitment_payments (
        id TEXT PRIMARY KEY NOT NULL,
        commitment_id TEXT NOT NULL,
        paid_amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        paid_at TEXT NOT NULL,
        notes TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL,
        FOREIGN KEY (commitment_id) REFERENCES commitments (id)
      );`,
      `CREATE TABLE IF NOT EXISTS rate_versions_cache (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        payload TEXT NOT NULL,
        effective_from TEXT,
        effective_to TEXT,
        sync_status TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS usage_counters_cache (
        id TEXT PRIMARY KEY NOT NULL,
        routes_calls INTEGER NOT NULL DEFAULT 0,
        trips_created INTEGER NOT NULL DEFAULT 0,
        exports_created INTEGER NOT NULL DEFAULT 0,
        period_start TEXT,
        sync_status TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`
    ]
  },
  {
    id: 5,
    name: "trips_sprint_4_mobile_fields",
    statements: [
      `ALTER TABLE trips ADD COLUMN calculation_mode TEXT;`,
      `ALTER TABLE trips ADD COLUMN origin_text TEXT;`,
      `ALTER TABLE trips ADD COLUMN destination_text TEXT;`,
      `ALTER TABLE trips ADD COLUMN ended_at TEXT;`,
      `ALTER TABLE trips ADD COLUMN odometer_mode TEXT;`,
      `ALTER TABLE trips ADD COLUMN odometer_distance_m INTEGER;`,
      `ALTER TABLE trips ADD COLUMN selected_route_distance_m INTEGER;`,
      `ALTER TABLE trips ADD COLUMN gps_distance_m INTEGER;`,
      `ALTER TABLE trips ADD COLUMN notes TEXT;`
    ]
  },
  {
    id: 6,
    name: "trips_sprint_4_route_and_evidence_fields",
    statements: [
      `ALTER TABLE trips ADD COLUMN odometer_start_evidence_uri TEXT;`,
      `ALTER TABLE trips ADD COLUMN odometer_end_evidence_uri TEXT;`,
      `ALTER TABLE trips ADD COLUMN route_option_label TEXT;`
    ]
  },
  {
    id: 7,
    name: "tng_sprint_6_import_foundation",
    statements: [
      `CREATE TABLE IF NOT EXISTS tng_statement_batches (
        id TEXT PRIMARY KEY NOT NULL,
        statement_id TEXT,
        label TEXT NOT NULL,
        source_file_name TEXT,
        source_file_uri TEXT,
        imported_at TEXT NOT NULL,
        transaction_count INTEGER NOT NULL DEFAULT 0,
        total_amount_cents INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `ALTER TABLE tng_transactions ADD COLUMN upload_batch_id TEXT;`,
      `ALTER TABLE tng_transactions ADD COLUMN source_file_uri TEXT;`,
      `ALTER TABLE tng_transactions ADD COLUMN source_file_path TEXT;`,
      `ALTER TABLE tng_transactions ADD COLUMN statement_label TEXT;`,
      `ALTER TABLE tng_transactions ADD COLUMN entry_datetime TEXT;`,
      `ALTER TABLE tng_transactions ADD COLUMN exit_datetime TEXT;`,
      `ALTER TABLE tng_transactions ADD COLUMN location TEXT;`,
      `ALTER TABLE tng_transactions ADD COLUMN raw_payload TEXT;`,
      `ALTER TABLE tng_transactions ADD COLUMN dedupe_key TEXT;`,
      `ALTER TABLE tng_transactions ADD COLUMN linked_claim_id TEXT;`,
      `CREATE INDEX IF NOT EXISTS idx_tng_transactions_batch
        ON tng_transactions (upload_batch_id);`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_tng_transactions_dedupe
        ON tng_transactions (dedupe_key)
        WHERE dedupe_key IS NOT NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_tng_statement_batches_imported
        ON tng_statement_batches (imported_at);`
    ]
  },
  {
    id: 8,
    name: "exports_sprint_7_foundation",
    statements: [
      `CREATE TABLE IF NOT EXISTS export_jobs (
        id TEXT PRIMARY KEY NOT NULL,
        format TEXT NOT NULL,
        status TEXT NOT NULL,
        claim_ids TEXT NOT NULL,
        row_count INTEGER NOT NULL DEFAULT 0,
        total_amount_cents INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL,
        filter_status TEXT,
        template_name TEXT,
        preview_payload TEXT,
        tng_appendix_payload TEXT,
        local_uri TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_export_jobs_created_at
        ON export_jobs (created_at);`
    ]
  },
  {
    id: 9,
    name: "ledger_entries_sprint_8",
    statements: [
      `DROP TABLE IF EXISTS ledger_entries;`,
      `CREATE TABLE IF NOT EXISTS ledger_entries (
        id TEXT PRIMARY KEY NOT NULL,
        space_type TEXT NOT NULL,
        entry_type TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'MYR',
        entry_date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        is_tax_deductible INTEGER NOT NULL DEFAULT 0,
        tax_category TEXT,
        payment_method TEXT,
        income_source TEXT,
        receipt_path TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_ledger_entries_space_date
        ON ledger_entries (space_type, entry_date);`,
      `CREATE INDEX IF NOT EXISTS idx_ledger_entries_type
        ON ledger_entries (space_type, entry_type, entry_date);`
    ]
  },
  {
    id: 10,
    name: "commitments_sprint_8",
    statements: [
      `DROP TABLE IF EXISTS commitments;`,
      `CREATE TABLE IF NOT EXISTS commitments (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'MYR',
        category TEXT NOT NULL,
        due_day INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        is_tax_relief INTEGER NOT NULL DEFAULT 0,
        tax_category TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        device_id TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_commitments_active
        ON commitments (is_active, start_date);`
    ]
  },
  {
    id: 11,
    name: "commitment_payments_sprint_8",
    statements: [
      `DROP TABLE IF EXISTS commitment_payments;`,
      `CREATE TABLE IF NOT EXISTS commitment_payments (
        id TEXT PRIMARY KEY NOT NULL,
        commitment_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        due_date TEXT NOT NULL,
        expected_amount_cents INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        paid_date TEXT,
        paid_amount_cents INTEGER,
        notes TEXT,
        sync_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        device_id TEXT NOT NULL,
        FOREIGN KEY (commitment_id) REFERENCES commitments(id)
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_commitment_payments_unique
        ON commitment_payments (commitment_id, year, month);`,
      `CREATE INDEX IF NOT EXISTS idx_commitment_payments_commitment
        ON commitment_payments (commitment_id);`
    ]
  },
  {
    id: 12,
    name: "sprint14_performance_indexes",
    statements: [
      `CREATE INDEX IF NOT EXISTS idx_claims_updated_desc
        ON claims (updated_at DESC) WHERE deleted_at IS NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_claim_items_updated_at
        ON claim_items (updated_at DESC) WHERE deleted_at IS NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_trips_updated_desc
        ON trips (updated_at DESC) WHERE deleted_at IS NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_tng_txn_date_desc
        ON tng_transactions (transaction_date DESC) WHERE deleted_at IS NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_tng_txn_sector_claimed
        ON tng_transactions (sector, claimed) WHERE deleted_at IS NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_ledger_date_desc
        ON ledger_entries (entry_date DESC) WHERE deleted_at IS NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_commitments_name
        ON commitments (name) WHERE deleted_at IS NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_receipts_entity_updated
        ON receipts (owner_entity_type, owner_entity_id, updated_at DESC)
        WHERE deleted_at IS NULL;`
    ]
  },
  {
    id: 13,
    name: "claim_items_rich_metadata_sprint15",
    statements: [
      `ALTER TABLE claim_items ADD COLUMN meal_session TEXT;`,
      `ALTER TABLE claim_items ADD COLUMN lodging_check_in TEXT;`,
      `ALTER TABLE claim_items ADD COLUMN lodging_check_out TEXT;`,
      `ALTER TABLE claim_items ADD COLUMN perdiem_days INTEGER;`,
      `ALTER TABLE claim_items ADD COLUMN perdiem_rate_myr REAL;`,
      `ALTER TABLE claim_items ADD COLUMN perdiem_destination TEXT;`,
      `ALTER TABLE claim_items ADD COLUMN merchant TEXT;`,
      `ALTER TABLE claim_items ADD COLUMN qty REAL;`,
      `ALTER TABLE claim_items ADD COLUMN unit TEXT;`,
      `ALTER TABLE claim_items ADD COLUMN rate_per_unit REAL;`
    ]
  },
  {
    id: 14,
    name: "profiles_cache_org_context_sprint16",
    statements: [
      `ALTER TABLE profiles_cache ADD COLUMN org_id TEXT;`,
      `ALTER TABLE profiles_cache ADD COLUMN org_role TEXT;`,
      `ALTER TABLE profiles_cache ADD COLUMN workspace_type TEXT;`,
      `ALTER TABLE profiles_cache ADD COLUMN effective_tier TEXT;`,
    ]
  }
];
