# apps/user-mobile-v2 — Documentation Index

**Last reorganized:** 2026-07-02
**Scope:** documentation for the `user-mobile-v2` Expo app (Android + iOS native, and PWA export from the same codebase). For repo-wide docs (Stripe, legal, QA playbooks, other apps), see the repo-root `docs/`.

Read in this order if you're onboarding onto this app:
1. `01-foundations/` — the original contracts (auth flow, sync API, file upload) this app was built against
2. `02-architecture-decisions/` — key decisions and their rationale (why local-first, dark/light mode, storage/sync design, PWA-vs-native parity)
3. `03-roadmaps/` — the two delivery roadmaps
4. `04-sprints/` — the full sprint-by-sprint build history, Sprint 1 through Sprint 24 (current)
5. `05-store-listing/` — Play Store submission copy and assets

For what's currently blocking shipping (Stripe finalization, sync engine fixes, the missing native billing screen, app store submission punch list), see `../../../docs/SHIP_READINESS_ACTION_PLAN.md` at the repo root — that plan supersedes/extends what's tracked in Sprint 23/24 below.

---

## `01-foundations/`
Written 2026-05-22, before sprint numbering started — the initial technical contracts the rewrite was built against.
1. `01_IMPLEMENTATION_START.md`
2. `02_AUTH_FLOW_MAPPING.md`
3. `03_SYNC_API_CONTRACT.md`
4. `04_FILE_UPLOAD_CONTRACT.md`
5. `05_FEATURE_PREPARATION_MAPPING.md`
6. `06_LOCAL_VERIFICATION_GUIDE.md`

## `02-architecture-decisions/`
1. `01_DARK_LIGHT_MODE_DECISION.md`
2. `02_STORAGE_AND_SYNC_ARCHITECTURE.md` — describes the SQLite (native) / in-memory (web) + sync queue design covered in more depth in the 2026-07-02 code review inside `SHIP_READINESS_ACTION_PLAN.md`.
3. `03_V1_PARITY_LOCK.md`
4. `04_PWA_VS_MOBILEV2_PARITY_TRACKER.md`

## `03-roadmaps/`
1. `01_FULL_DELIVERY_ROADMAP.md`
2. `02_SPRINT_20_PLUS_ROADMAP.md`

## `04-sprints/`
All sprint signoffs and plans, **filenames unchanged** — `SPRINT_N` is a meaningful ID referenced by number in later sprint docs (e.g. Sprint 24 depends on Sprint 23), so renumbering the files themselves would break those references. Sorts numerically 1 → 24; Sprint 3 has three related documents (sign-off, work-claims core parity, work-claims QA script); Sprint 20 has two parallel tracks (20A org invite, 20B subscription gating).

- `recovery-a-work-claims/` — a 5-document mid-stream course-correction on Work Claims parity (2026-05-24/25), sitting chronologically between Sprint 3 and Sprint 4. Kept as its own subfolder rather than mixed into the numbered sprint sequence since it isn't itself a numbered sprint.

**Current status:** Sprint 24 (Cross-Device Sync Hardening) is the latest, marked `NOT STARTED` as of its creation (2026-06-20), depending on Sprint 23 Track B. Check `SHIP_READINESS_ACTION_PLAN.md` for what's actually still open — sprint docs may be stale relative to the live checklist there.

## `05-store-listing/`
1. `01_PLAY_STORE_LISTING.md`
2. `02_feature-graphic.html`

## `archive/`
Resolved Android build-error logs. See `archive/README.md`.
