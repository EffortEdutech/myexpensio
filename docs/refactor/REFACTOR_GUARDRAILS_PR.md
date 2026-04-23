# Refactor Guardrails PR

## Purpose

This PR adds repeatable guardrails so the current refactor state stays stable.

## What this PR adds

1. `pnpm clean:build`
   - clears `.next` caches for user and admin apps
   - clears root `.turbo`

2. `pnpm audit:refactor-lock`
   - runs the route/import lock audit

3. `pnpm audit:db-runtime`
   - fails if legacy DB monetization object names appear in runtime code

4. `pnpm audit:type-residue`
   - fails if legacy schema/type residue appears in runtime code

5. `pnpm validate:full`
   - runs clean build + build validation + lock audit + DB residue audits

6. `pnpm health:refactor`
   - same intent as `validate:full`, but via a readable PowerShell runner

## Why this PR matters

The repo is now build-green and Vercel-green. This PR makes that state easier to preserve by turning the manual verification flow into repeatable commands.

## Recommended usage

### Normal local verification

```powershell
pnpm validate
```

### Full refactor verification

```powershell
pnpm validate:full
```

### If a generated `.next` route/types file acts up again

```powershell
pnpm clean:build
pnpm validate
```

## Suggested commit message

```text
chore: add refactor guardrails and cache cleanup scripts
```
