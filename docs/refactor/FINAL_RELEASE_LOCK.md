# Final Release Lock PR

## Objective

Freeze the post-refactor baseline into a repeatable release process.

This PR does not change business logic.
It locks the repository around the state that is already passing:

- DB cleanup completed
- runtime residue cleanup completed
- runtime DB guardrail passing
- user/admin builds green

## Files in this pack

- `package.json`
- `.gitignore`
- `README.md`
- `scripts/release-lock-check.ps1`
- `docs/refactor/FINAL_RELEASE_LOCK.md`

## Why this PR exists

The repo is green, but the root still benefits from a final release lock:

- root scripts should expose full validation and guardrail validation
- generated audit reports should stay out of git
- the repo README should describe the actual runtime baseline
- a single release-lock script should verify that legacy runtime paths do not come back

## What to do

### 1. Copy files into the repo root
Replace the matching files with the versions from this pack.

### 2. Run the release-lock check
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\release-lock-check.ps1
```

### 3. Run the full validation
```powershell
pnpm validate:full
```

### 4. Commit the lock
Suggested commit message:

```text
chore: lock release baseline after refactor cleanup
```

## Expected result

- release-lock check passes
- `pnpm validate:full` passes
- audit reports are ignored by git
- root README reflects the current platform baseline
