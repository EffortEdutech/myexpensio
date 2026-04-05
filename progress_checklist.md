# MyExpensio — Progress Checklist

**Status:** Updated to reflect current repo build state  
**Milestone:** User App **UAT-ready**

---

## A. User App

### Core access and structure
- [x] User app scaffold exists
- [x] User auth flow available
- [x] Main user navigation in place
- [x] Home dashboard implemented
- [x] Settings page implemented

### Trips
- [x] Trips list implemented
- [x] GPS trip entry flow implemented
- [x] GPS active-trip / resume flow implemented
- [x] Odometer trip entry implemented
- [x] Mileage calculator / planned trip flow implemented
- [x] Trip detail access implemented

### Claims
- [x] Claims list implemented
- [x] Claim detail implemented
- [x] Draft vs Submitted state implemented
- [x] Submitted claim locking enforced
- [x] Claim deletion flow for draft claims implemented

### Claim item types
- [x] Mileage items implemented
- [x] Meal items implemented
- [x] Lodging items implemented
- [x] Toll items implemented
- [x] Parking items implemented
- [x] Transport items implemented
- [x] Per Diem items implemented
- [x] Misc items implemented

### Rates and policies
- [x] Mileage rate settings implemented
- [x] Meal rate settings implemented
- [x] Lodging rate settings implemented
- [x] Per Diem default rate implemented
- [x] Rate persistence via settings API implemented

### TNG integration
- [x] TNG-linked claim item support implemented
- [x] TNG pending / verified states shown in claim UI
- [x] TNG unlink flow implemented

### Export
- [x] CSV export implemented
- [x] XLSX export implemented
- [x] PDF export implemented
- [x] Export job logging implemented

### Readiness
- [x] User App ready for UAT

---

## B. Admin App

### Access and protection
- [x] Separate admin app scaffold exists
- [x] Admin login page implemented
- [x] Supabase session refresh middleware implemented
- [x] Admin-only role gating implemented
- [x] Unauthorized loop protection handled

### Admin pages
- [ ] Dashboard completed
- [ ] Organizations list completed
- [ ] Create organization workflow completed
- [ ] Organization detail workflow completed
- [ ] Invite list / invite create workflow completed

### Readiness
- [ ] Admin App ready for UAT

---

## C. Enhancements

### Tracking and docs
- [x] `progress.md` updated to reflect actual build state
- [x] Progress checklist split into User App / Admin App / Enhancements
- [ ] Keep status files in sync with repo as development continues

### Product / platform next steps
- [ ] Complete admin operational workflows
- [ ] Review dependency alignment between user app and admin app
- [ ] Improve export template / format management
- [ ] Implement original statement attachment + claim highlighting workflow
- [ ] Polish export history / retry / download UX

---

## Current Development Position
- **User App:** stable enough for structured user testing
- **Admin App:** protected and scaffolded, but still partially placeholder
- **Next recommended build target:** Admin App completion or export enhancement batch

