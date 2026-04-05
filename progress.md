# MyExpensio — Progress (Local Dev)

## Status Summary
- **Overall milestone:** User App is **UAT-ready**
- **Current focus:** Admin App completion + selected enhancement batch
- **Phase posture:** Core user reimbursement flow is functioning and ready for user testing

## Running Services
- User app: `http://localhost:3100`
- Admin app: `http://localhost:3101`
- Supabase Studio: `http://127.0.0.1:54323`
- Mailpit: `http://127.0.0.1:54324`

## Current Build Assessment
### User App
The user-facing app is now beyond scaffold stage and is ready for structured UAT.

Implemented and functioning:
- Auth flow for user app
- Home dashboard with quick actions and monthly stats
- Trips module:
  - GPS trip flow
  - Odometer trip entry
  - Mileage calculator / planned trip entry
  - Trips listing and detail access
- Claims module:
  - Claim list and claim detail
  - Mileage items
  - Meal items
  - Lodging items
  - Toll items
  - Parking items
  - Transport items
  - Per Diem items
  - Misc items
  - Draft vs Submitted lock behavior
- Rates / Settings:
  - Mileage
  - Meal
  - Lodging
  - Per Diem
- TNG-linked reimbursement flow integrated into claims
- Export generation implemented:
  - CSV
  - XLSX
  - PDF

### Admin App
The admin app is partially implemented.

Implemented:
- Separate admin app scaffold
- Admin login page
- Middleware session refresh
- Admin-only access gating via `profiles.role = 'ADMIN'`

Still incomplete / placeholder:
- Organizations list page
- Create organization page
- Organization invite management pages
- Full admin CRUD and management workflows

## Phase 1 Progress Checklist

### A. User App
- [x] User auth flow available
- [x] Home dashboard implemented
- [x] Trips list implemented
- [x] GPS trip entry flow implemented
- [x] Odometer trip entry flow implemented
- [x] Mileage calculator / planned trip entry implemented
- [x] Claims list implemented
- [x] Claim detail implemented
- [x] Mileage claim items implemented
- [x] Meal claim items implemented
- [x] Lodging claim items implemented
- [x] Toll claim items implemented
- [x] Parking claim items implemented
- [x] Transport claim items implemented
- [x] Per Diem claim items implemented
- [x] Misc claim items implemented
- [x] Submitted claim locking enforced
- [x] Rates settings implemented
- [x] Per Diem default rate implemented
- [x] TNG-linked claim flow implemented
- [x] CSV export implemented
- [x] XLSX export implemented
- [x] PDF export implemented
- [x] User app ready for UAT

### B. Admin App
- [x] Separate admin app scaffold exists
- [x] Admin login page implemented
- [x] Admin middleware implemented
- [x] Admin role gating implemented
- [ ] Organizations list page completed
- [ ] Create organization workflow completed
- [ ] Organization detail page completed
- [ ] Invite management workflow completed
- [ ] Admin operational CRUD completed
- [ ] Admin app ready for UAT

### C. Enhancements
- [ ] Update progress tracking docs to reflect actual repo state
- [ ] Refresh development checklist based on real build status
- [ ] Decide next active build target after UAT starts
- [ ] Admin app completion
- [ ] Export template management improvements
- [ ] Original statement attachment + highlight workflow
- [ ] Export history / retry / download polish
- [ ] Dependency alignment review between user app and admin app

## Recommended Immediate Next Step
1. Freeze current milestone as **User App UAT-ready**
2. Keep collecting user feedback on the user app
3. Continue development on:
   - **Admin App completion**, or
   - **Export/PDF enhancement batch**

## Notes
- Earlier progress notes were outdated and understated the current repo status.
- This file now reflects the actual build state more accurately.
- Use this file as the active progress source unless superseded by a newer locked project status file.

