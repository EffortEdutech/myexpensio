# MyExpensio PR 1 File Pack — Domain Foundation

This pack is meant to be unpacked at the repository root.

## What is included
- `packages/domain/*`
- app package.json updates for workspace dependency
- app next.config.ts updates for `transpilePackages`
- membership compatibility re-exports
- admin audit page/client starter refactor
- admin lib/types.ts starter cleanup

## How to use
1. Unzip into the repo root.
2. Review the changed files.
3. Run:
   - `pnpm install`
   - `pnpm -C apps/admin build`
4. If build shows the next type issue, continue with PR 1 follow-up fixes.

## Notes
- `packages/domain` is TS-only. No React or Next imports.
- This pack is intentionally foundation-first.
- User rates logic cleanup remains for PR 3.
