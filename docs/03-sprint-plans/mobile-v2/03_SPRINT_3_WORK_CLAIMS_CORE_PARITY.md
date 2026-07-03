# User Mobile v2 Sprint 3: Work Claims Core Parity

Date: 2026-05-23

Implementation folder:

```text
apps/user-mobile-v2
```

Sprint package:

```text
apps/user-mobile-v2/docs/04-sprints/SPRINT_3_WORK_CLAIMS_CORE_PARITY.md
```

## Sprint Summary

Sprint 3 is the first real product parity sprint for the new local-first mobile
app. It focuses on completing the Work Claims draft workflow so a user can
create, edit, itemize, submit, and reopen claim data offline.

## Committed Outcome

The sprint is complete only when the Work Claims workflow can be manually tested
as an end-to-end local-first feature.

Core outcome:

```text
Create claim -> edit claim -> add items -> attach receipt metadata -> submit -> reopen -> verify persistence
```

## Zero-Budget Confirmation

The sprint remains zero-budget:

- No paid Expo/EAS requirement.
- No paid storage.
- No paid OCR.
- No paid maps.
- No paid background services.
- No new paid dependency.

## Source Boundary

Do not modify:

```text
apps/user
```

Use the existing app only as a reference.

## Commit Discipline

Because GitHub may auto-commit version changes, push with:

```text
git pull --rebase --autostash
git push
```

Stage only the sprint files:

```text
git add apps/user-mobile-v2 docs/USER_MOBILE_V2_SPRINT_3_WORK_CLAIMS_CORE_PARITY.md
```
