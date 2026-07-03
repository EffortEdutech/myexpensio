# DB Runtime Guardrail Hardening PR

## Purpose

This PR makes the database runtime audit enforceable.

Before this PR, the runtime audit was noisy because it scanned:

- audit reports
- docs
- SQL investigation files
- migration helpers
- archive folders

That made `-FailOnHits` unreliable.

After this PR, the runtime audit scans only runtime code:

- `apps/**`
- `packages/**`

## Files in this pack

- `scripts/db-runtime-audit.ps1`
- `scripts/archive-runtime-audit-temp-files.ps1`
- `docs/refactor/DB_RUNTIME_GUARDRAIL_HARDENING.md`

## What to do

### 1. Replace the runtime audit script

Overwrite:

- `scripts/db-runtime-audit.ps1`

### 2. Archive old temporary runtime-audit fix files

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\archive-runtime-audit-temp-files.ps1
```

### 3. Run the hardened runtime audit

Normal mode:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\db-runtime-audit.ps1
```

Strict mode:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\db-runtime-audit.ps1 -FailOnHits
```

### 4. Re-run app validation

```powershell
pnpm validate
```

## Expected result

- runtime audit should report only runtime-code findings
- if runtime code is already clean, strict mode should pass
- `pnpm validate` should remain green

## Suggested commit message

```text
chore: harden db runtime audit guardrail to runtime code only
```
