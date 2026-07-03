# myexpensio — Manual UAT Checklist
### User Acceptance Testing · May 2026

---

## How to Use This Checklist

Work through each **Phase in order, top to bottom.** Every phase depends on the one before it — do not skip ahead. Each phase lists what accounts and data you need going in, and what it produces for the next phase.

**Test environments:**

| App | URL |
|---|---|
| User App | https://myexpensio-jade.vercel.app |
| Workspace Admin | https://myexpensio-admin.vercel.app |
| CS Console | https://myexpensio-cs.vercel.app |

**Legend:** ✅ Pass &nbsp;&nbsp; ❌ Fail &nbsp;&nbsp; ⏭ Skip (with reason)

---

## Phase 1 — Platform Setup (Super-Admin)

**Who:** Super-admin account (Expensio Workspace admin app)
**Needs:** Super-admin login credentials
**Produces:** A test organisation, a rate template, subscription tier set

---

### 1.1 Super-Admin Login

| # | Step | Expected Result | Result |
|---|---|---|---|
| 1.1.1 | Open Workspace Admin app. Do not log in. Navigate to any protected page. | Redirected to `/auth/login`. | |
| 1.1.2 | Log in with super-admin credentials. | Dashboard loads. `/orgs` link visible in sidebar. | |
| 1.1.3 | Try accessing `/orgs` as a non-super-admin account (e.g. open a regular workspace admin session in incognito). | 403 or redirect. Page not accessible. | |

---

### 1.2 Create a Test Organisation

| # | Step | Expected Result | Result |
|---|---|---|---|
| 1.2.1 | Navigate to **Orgs → New Organisation**. | Organisation creation form appears. | |
| 1.2.2 | Enter: Name = `UAT Test Workspace`, Display Name = `UAT Test`, Contact Email = `admin@test.com`. Click Save. | Organisation created. Appears in the `/orgs` list. | |
| 1.2.3 | Open the new org's detail page. | Shows org profile, status = ACTIVE, tier = FREE. | |
| 1.2.4 | Try creating a second org with the same name. | Error shown: "Organisation already exists." | |

> **Record the new Org ID** — you will need it in later phases.

---

### 1.3 Create a Rate Template

| # | Step | Expected Result | Result |
|---|---|---|---|
| 1.3.1 | Navigate to **Rates**. Click "New Template". | Rate template form appears. | |
| 1.3.2 | Enter: Template Name = `UAT Standard Rate`, Rate per km = `0.60`, Currency = `MYR`. Save. | Template saved. Appears in the rates list. | |
| 1.3.3 | Assign the new template to `UAT Test Workspace` via the org's admin settings. | `rate_template_name` saved for that org. | |

---

### 1.4 Set Subscription Tier

| # | Step | Expected Result | Result |
|---|---|---|---|
| 1.4.1 | On the `UAT Test Workspace` org detail, change Tier to **PRO**. | Tier updated to PRO in `subscription_status`. | |
| 1.4.2 | Change Tier back to **FREE**. | Tier reverts to FREE. Usage limits apply. | |

> Leave the org on **FREE** for now — we will test limit enforcement later.

---

## Phase 2 — Workspace Configuration (Workspace Admin)

**Who:** Workspace admin account (`admin@test.com`)
**Needs:** Phase 1 completed. `admin@test.com` must already be a member of `UAT Test Workspace` (set this up manually in Supabase or via CS if needed for the first run).
**Produces:** Workspace configured, rates set, invitation created for test employee

---

### 2.1 Workspace Admin Login

| # | Step | Expected Result | Result |
|---|---|---|---|
| 2.1.1 | Open Workspace Admin app. Log in with `admin@test.com`. | Dashboard loads. Shows `UAT Test Workspace` in the header. | |
| 2.1.2 | Confirm the sidebar shows: Members, Claims, Rates, Settings, Audit Log. | All navigation items visible. | |
| 2.1.3 | Confirm `/orgs` (super-admin section) is NOT accessible. | 403 or item not shown. | |

---

### 2.2 Workspace Settings

| # | Step | Expected Result | Result |
|---|---|---|---|
| 2.2.1 | Navigate to **Settings**. | Shows workspace name, contact email, current tier (FREE). | |
| 2.2.2 | Update Display Name to `UAT Test Company`. Save. | Name updated. Reflected in the header. | |
| 2.2.3 | Navigate to the **Billing** section within Settings. | Shows tier = FREE, usage counters for current month (all zeros if new). | |

---

### 2.3 Configure Workspace Rates

| # | Step | Expected Result | Result |
|---|---|---|---|
| 2.3.1 | Navigate to **Rates**. | Current rate shown (from the template assigned in Phase 1, or a default). | |
| 2.3.2 | Add a workspace-level rate: `0.60 MYR/km`, effective from today. Save. | New rate appears in the list with today's effective date. | |
| 2.3.3 | Verify the rate is marked as the current active rate. | The new rate is highlighted or labelled "Current". | |

---

### 2.4 Invite a Test Employee

| # | Step | Expected Result | Result |
|---|---|---|---|
| 2.4.1 | Navigate to **Members**. | Member list shown. Currently only `admin@test.com`. | |
| 2.4.2 | Click **Invite Member**. Enter email: `employee@test.com`, Role: `EMPLOYEE`. Send. | Invitation created. Success message shown. Status = PENDING. | |
| 2.4.3 | Verify the invitation appears in the Members list (or pending invitations list) with status PENDING. | Invitation row visible. | |
| 2.4.4 | Try inviting the same email again while the first invite is still PENDING. | Error shown. Duplicate invitation blocked. | |

> **The invitation email is now in `employee@test.com`'s inbox.** Proceed to Phase 3.

---

## Phase 3 — Employee Onboarding

**Who:** New employee (`employee@test.com`)
**Needs:** Phase 2.4 completed. Invitation email received by `employee@test.com`.
**Produces:** Active employee account, member of `UAT Test Workspace`

---

### 3.1 Accept Invitation

| # | Step | Expected Result | Result |
|---|---|---|---|
| 3.1.1 | Open the invitation email sent to `employee@test.com`. Click the invite link. | Browser opens the User App `/accept-invite` page. Shows workspace name = `UAT Test Company`. | |
| 3.1.2 | The page asks to verify your email. Enter OTP sent to `employee@test.com`. | OTP accepted. Form now shows a display name field. | |
| 3.1.3 | Enter Display Name = `Test Employee`. Click **Accept Invitation**. | Account created. Redirected to the User App dashboard. Workspace name shown. | |
| 3.1.4 | Open the same invite link again in a new browser tab. | Error shown: "This invitation has already been used." | |
| 3.1.5 | Go back to Workspace Admin → Members. Refresh. | `employee@test.com` now shows as ACTIVE member, role = EMPLOYEE. | |

---

### 3.2 Employee First Login Check

| # | Step | Expected Result | Result |
|---|---|---|---|
| 3.2.1 | On the User App, navigate to **Settings → Profile**. | Shows Display Name = `Test Employee`, email = `employee@test.com`. | |
| 3.2.2 | Navigate to **Settings → Rates** (or Billing). | Shows current mileage rate (0.60 MYR/km from workspace config). | |
| 3.2.3 | Log out. Try navigating directly to `/dashboard`. | Redirected to `/login`. | |
| 3.2.4 | Log back in. | Session restored. Dashboard loads. | |

---

## Phase 4 — Trip Recording

**Who:** Employee (`employee@test.com`) logged into User App
**Needs:** Phase 3 completed. Active employee session.
**Produces:** At least 3 FINAL trips (one per mode) to use in claims

---

### 4.1 Trip — Point to Point (Selected Route)

| # | Step | Expected Result | Result |
|---|---|---|---|
| 4.1.1 | Navigate to **Trips**. Click **New Trip**. | Trip creation form appears. | |
| 4.1.2 | Select mode: **Point to Point**. Enter Origin = `KLCC, Kuala Lumpur`, Destination = `Petaling Jaya, Selangor`. | Route alternatives load on a map. At least one route with a distance shown. | |
| 4.1.3 | Select a route. Confirm. | Trip saved. Status = FINAL. Distance shown in km. | |
| 4.1.4 | Verify the trip appears in the trip list. | Trip row shows origin, destination, distance, and date. | |
| 4.1.5 | Click the trip to view detail. | Detail page shows all fields including vehicle type and distance source = `SELECTED_ROUTE`. | |

> **Record Trip 1 ID** (selected route, car) for use in Phase 5.

---

### 4.2 Trip — Odometer

| # | Step | Expected Result | Result |
|---|---|---|---|
| 4.2.1 | Click **New Trip**. Select mode: **Odometer**. | Odometer distance input appears. | |
| 4.2.2 | Enter distance = `30`. Vehicle type = `motorcycle`. (Optional) Upload odometer photos. Click Save. | Trip saved immediately as FINAL. | |
| 4.2.3 | View the trip detail. | Shows distance = 30 km, vehicle_type = motorcycle, distance_source = ODOMETER. | |

> **Record Trip 2 ID** (odometer, motorcycle) for use in Phase 5.

---

### 4.3 Trip — GPS Live Tracking

| # | Step | Expected Result | Result |
|---|---|---|---|
| 4.3.1 | Click **New Trip**. Select mode: **GPS Tracking**. Grant location permission when browser asks. | Trip starts. Status = DRAFT. Tracking indicator / timer visible. | |
| 4.3.2 | Wait at least 30 seconds (or simulate movement if on mobile). Click **End Trip**. | Trip finalised. Status = FINAL. Distance calculated from GPS points. | |
| 4.3.3 | View the trip detail. | Shows GPS distance and distance_source = GPS. | |

> **Record Trip 3 ID** (GPS) for use in Phase 5.

---

## Phase 5 — Claim Creation & Submission

**Who:** Employee (`employee@test.com`)
**Needs:** Phase 4 completed. At least Trip 1 (FINAL, selected route, car).
**Produces:** One SUBMITTED claim with multiple item types

---

### 5.1 Create a Draft Claim

| # | Step | Expected Result | Result |
|---|---|---|---|
| 5.1.1 | Navigate to **Claims**. Click **New Claim**. | Claim creation form shown. | |
| 5.1.2 | Enter Title = `UAT May 2026 Claim`, Period Start = first day of this month, Period End = today. Save. | DRAFT claim created. Shows in claim list. | |
| 5.1.3 | Open the claim. | Detail page shows status = DRAFT, total = RM 0.00, no items yet. | |

---

### 5.2 Add Claim Items

| # | Step | Expected Result | Result |
|---|---|---|---|
| 5.2.1 | Click **Add Item → Mileage**. Select Trip 1 (KLCC → PJ, car). | Mileage item added. Amount = distance × 0.60 MYR. Auto-calculated. | |
| 5.2.2 | Click **Add Item → Mileage**. Select Trip 2 (odometer, motorcycle). | Mileage item added. Confirm amount is calculated (note if motorcycle rate differs from car). | |
| 5.2.3 | Click **Add Item → Receipt**. Enter: Merchant = `Petrol Station`, Amount = `RM 80.00`, Date = today. Upload a photo. | Receipt item added. Photo preview shown. | |
| 5.2.4 | Click **Add Item → Meal**. Enter: Amount = `RM 15.00`, Session = `Lunch`, Date = today. | Meal item added with correct amount. | |
| 5.2.5 | Click **Add Item → Per Diem**. Enter: Destination = `Johor Bahru`, Days = `2`, Date = today. | Per-diem item added. Amount = 2 × daily rate. | |
| 5.2.6 | Verify claim total after all items. | Total = sum of all items. Matches RM amounts added. | |

---

### 5.3 TnG Statement Import & Linking

| # | Step | Expected Result | Result |
|---|---|---|---|
| 5.3.1 | Navigate to **TnG Statements**. Click **Upload Statement**. Select a real TnG eWallet PDF. | Transactions extracted. Table shown with date, merchant, and amount for each row. | |
| 5.3.2 | Upload the same PDF again. | No duplicate transactions created (or a warning shown). | |
| 5.3.3 | Select a transaction. Click **Link to Claim Item**. Choose the receipt item from 5.2.3. | Claim item now shows `paid_via_tng = true`. TnG reference attached. | |
| 5.3.4 | Try uploading a non-TnG PDF (e.g. any random PDF). | Error shown: could not parse as TnG statement. | |

---

### 5.4 Submit the Claim

| # | Step | Expected Result | Result |
|---|---|---|---|
| 5.4.1 | Return to the claim detail. Click **Submit Claim**. | Confirmation dialog appears showing the total amount. | |
| 5.4.2 | Confirm submission. | Status changes to SUBMITTED. All "Edit" and "Add Item" buttons disappear. | |
| 5.4.3 | Try clicking "Add Item" on the now-SUBMITTED claim (or navigate directly to the add-item URL). | Error shown: "Cannot edit a submitted claim." | |
| 5.4.4 | Try submitting the same claim again. | 409 Conflict returned. No change. | |

> **Record the Claim ID** — needed for Phase 6 and Phase 7.

---

### 5.5 Validation — Empty Claim Guard

| # | Step | Expected Result | Result |
|---|---|---|---|
| 5.5.1 | Create a second new DRAFT claim with no items. Try to submit it. | Error shown: "Cannot submit a claim with no items." | |

---

## Phase 6 — Claims Review (Workspace Admin)

**Who:** Workspace Admin (`admin@test.com`) on Workspace Admin app
**Needs:** Phase 5 completed. Claim is SUBMITTED.
**Produces:** Admin has reviewed the claim (approval not yet available — noted as gap)

---

### 6.1 View Submitted Claims

| # | Step | Expected Result | Result |
|---|---|---|---|
| 6.1.1 | Log in to Workspace Admin app as `admin@test.com`. Navigate to **Claims**. | Claims list shown. `UAT May 2026 Claim` appears with status = SUBMITTED. | |
| 6.1.2 | Filter by Status = **SUBMITTED**. | Only SUBMITTED claims shown. DRAFT claims hidden. | |
| 6.1.3 | Filter by date range covering today. | Claim still visible. | |
| 6.1.4 | Click the `UAT May 2026 Claim` to open detail. | Claim detail shows all items, amounts, trip data, TnG reference, and employee info. No edit controls shown. | |
| 6.1.5 | Verify mileage items show correct distance and amount. | Distance matches what was recorded in Phase 4. Amount = distance × workspace rate. | |
| 6.1.6 | ⚠️ Try to approve or reject the claim. | **Expected gap:** No approve/reject button exists. This is a known missing feature (see Audit Issue A1). Note result. | |

---

## Phase 7 — Export Generation

**Who:** Employee (`employee@test.com`) on User App
**Needs:** Phase 5 completed. At least one SUBMITTED claim.
**Produces:** PDF, CSV, and XLSX export files

---

### 7.1 Generate Exports

| # | Step | Expected Result | Result |
|---|---|---|---|
| 7.1.1 | Navigate to **Exports**. | Export page loads. History list shown (empty or previous exports). | |
| 7.1.2 | Select the `UAT May 2026 Claim`. Choose format = **PDF**. Click Generate. | PDF generated. Download link appears in the page. | |
| 7.1.3 | Download and open the PDF. | PDF contains: claim title, employee name, all items with amounts, mileage details, receipt list, total, and declaration section. | |
| 7.1.4 | Select the same claim. Choose format = **CSV**. Click Generate. | CSV downloaded. | |
| 7.1.5 | Open the CSV in Excel or a text editor. | Contains correct column headers and one data row per claim item with correct amounts. | |
| 7.1.6 | Select the same claim. Choose format = **XLSX**. Click Generate. | Excel file downloaded. | |
| 7.1.7 | Open the XLSX file. | Data in correct columns. Totals row present. | |
| 7.1.8 | Navigate to export history. | All 3 exports listed with format labels, timestamps, and download links. | |

---

### 7.2 Export Limits (FREE Tier)

| # | Step | Expected Result | Result |
|---|---|---|---|
| 7.2.1 | Navigate to **Settings → Billing**. Check exports used this month. | Counter reflects the exports generated in 7.1. | |
| 7.2.2 | If the FREE export limit has been reached, try generating another export. | Error shown: "You've reached your export generation limit." with reset date. | |

---

## Phase 8 — Usage Limits & Billing Upgrade

**Who:** Employee or Admin on User App
**Needs:** Phase 3 completed. Workspace on FREE tier.
**Produces:** Confirmed limit enforcement + Pro subscription activated

---

### 8.1 FREE Tier Limits

| # | Step | Expected Result | Result |
|---|---|---|---|
| 8.1.1 | Navigate to **Settings → Billing**. | Usage meters shown for routes, trips, and exports this month with current counts and limits. | |
| 8.1.2 | Exhaust the route calculation limit (default = 2 per month) by creating two selected-route trips. On the 3rd attempt, go to New Trip → Point to Point and try to get route alternatives. | Error shown: "You've reached your route calculation limit." | |
| 8.1.3 | Verify trips_created counter increments after each new trip. | Counter increases by 1 per trip. | |

---

### 8.2 Upgrade to Pro (Stripe Test Mode)

| # | Step | Expected Result | Result |
|---|---|---|---|
| 8.2.1 | Navigate to **Settings → Billing**. Click **Upgrade to Pro**. | Stripe Checkout page opens. Shows "myexpensio Pro" with monthly price. | |
| 8.2.2 | Enter test card: `4242 4242 4242 4242`, expiry `12/29`, CVC `123`, any name. Click **Pay**. | Redirected back to the User App. Success message shown. | |
| 8.2.3 | Return to **Settings → Billing**. | Tier = **Pro**. Usage limits show as Unlimited. | |
| 8.2.4 | Try creating a route or trip that was previously blocked. | Action succeeds — no limit error. | |
| 8.2.5 | Open Stripe Dashboard (test mode) → Customers. | Test customer exists with an Active subscription for this workspace. | |
| 8.2.6 | Try clicking "Upgrade to Pro" again while already on Pro. | Error shown: "This workspace already has an active Pro subscription." (409). | |

---

### 8.3 Billing Portal

| # | Step | Expected Result | Result |
|---|---|---|---|
| 8.3.1 | Navigate to **Settings → Billing**. Click **Manage Subscription** (or Billing Portal). | Redirected to Stripe's hosted billing portal for this customer. | |
| 8.3.2 | Verify the portal shows the current plan and a cancel option. | Stripe portal loads with correct plan details. | |
| 8.3.3 | Close/cancel out of the portal without making changes. | Redirected back to the User App billing page. | |

---

## Phase 9 — CS Console Operations

**Who:** CS console staff (`cs@test.com`)
**Needs:** Phase 1–5 completed. Test workspace and employee exist in the database.
**Produces:** Confirmed CS visibility and control over all workspaces

---

### 9.1 CS Login & Access Control

| # | Step | Expected Result | Result |
|---|---|---|---|
| 9.1.1 | Open CS Console app. Log in with `cs@test.com`. | Console dashboard loads. | |
| 9.1.2 | Try logging in to the CS Console with `employee@test.com`. | Access denied. Not a console staff account. | |

---

### 9.2 Workspace Visibility

| # | Step | Expected Result | Result |
|---|---|---|---|
| 9.2.1 | Navigate to **Workspaces**. | All workspaces listed including `UAT Test Workspace`. | |
| 9.2.2 | Search for `UAT Test`. | `UAT Test Workspace` appears in results. | |
| 9.2.3 | Click `UAT Test Workspace` to view detail. | Shows org profile, tier, status, and member list including `admin@test.com` and `employee@test.com`. | |
| 9.2.4 | Suspend `UAT Test Workspace`. | Status changes to SUSPENDED. | |
| 9.2.5 | Open the User App in another tab and try to log in as `employee@test.com`. | Login denied or workspace shown as suspended. | |
| 9.2.6 | Reactivate the workspace in CS Console. | Status returns to ACTIVE. | |
| 9.2.7 | Verify `employee@test.com` can access the User App again. | Login succeeds. Dashboard loads normally. | |

---

### 9.3 User Management

| # | Step | Expected Result | Result |
|---|---|---|---|
| 9.3.1 | Navigate to **Users**. Search for `employee@test.com`. | User profile shown with workspace membership and last login. | |
| 9.3.2 | Trigger a password reset for `employee@test.com`. | User receives a reset email from Supabase. | |
| 9.3.3 | View the user's workspaces. | `UAT Test Workspace` listed with role = EMPLOYEE. | |

---

### 9.4 Invitation Queue

| # | Step | Expected Result | Result |
|---|---|---|---|
| 9.4.1 | Navigate to **Invitation Queue**. | All invitation requests across all workspaces listed. | |
| 9.4.2 | Filter by status = **PENDING**. | Only pending requests shown. | |
| 9.4.3 | If a pending request exists: approve it. | Status changes to APPROVED. | |
| 9.4.4 | If a pending request exists: reject one with reason = `Test rejection`. | Status changes to REJECTED. Reason saved. | |

---

### 9.5 Subscription Management via CS

| # | Step | Expected Result | Result |
|---|---|---|---|
| 9.5.1 | Find `UAT Test Workspace` subscription. Manually change tier to **PRO**. | Tier updated to PRO. Workspace gets Pro entitlements. | |
| 9.5.2 | Verify in User App (as employee) that limits now show as Unlimited. | Usage meters show unlimited. | |
| 9.5.3 | Change tier back to **FREE** via CS Console. | Tier reverts to FREE. Limits re-enforced on next usage check. | |

---

## Phase 10 — Audit Trail Verification

**Who:** Workspace Admin and Super-Admin
**Needs:** All phases above completed.
**Produces:** Confirmed audit log accuracy

---

| # | Step | Expected Result | Result |
|---|---|---|---|
| 10.1 | Workspace Admin → navigate to **Audit Log**. | Events shown for this workspace. | |
| 10.2 | Verify these events are present: `INVITE_ACCEPTED` (from Phase 3), claim submission (from Phase 5), member role changes. | All expected events visible with correct timestamps, actor, and details. | |
| 10.3 | Super-Admin → navigate to Audit Log (all orgs). Filter by `UAT Test Workspace`. | Same events visible, plus `ORG_CREATED` from Phase 1. | |
| 10.4 | Filter audit log by event type = `ORG_CREATED`. | Only org creation events shown. | |

---

## Sign-Off

| Phase | Description | Tester | Date | Pass/Fail |
|---|---|---|---|---|
| Phase 1 | Platform Setup | | | |
| Phase 2 | Workspace Configuration | | | |
| Phase 3 | Employee Onboarding | | | |
| Phase 4 | Trip Recording | | | |
| Phase 5 | Claim Creation & Submission | | | |
| Phase 6 | Claims Review | | | |
| Phase 7 | Export Generation | | | |
| Phase 8 | Billing & Upgrade | | | |
| Phase 9 | CS Console | | | |
| Phase 10 | Audit Trail | | | |

**Overall UAT Result:** &nbsp;&nbsp; ☐ PASS &nbsp;&nbsp; ☐ FAIL &nbsp;&nbsp; ☐ CONDITIONAL PASS (with noted exceptions)

**Known gaps that do not block sign-off:**
- Claim approval/rejection endpoint not yet built (Audit Issue A1) — claims can be viewed but not formally approved.
- Motorcycle mileage rate may default to car rate (Audit Issue A3) — verify amounts manually.

**Tester notes:**

_______________________________________________

_______________________________________________

---

*Checklist version 2.0 — myexpensio v3.1.2 — May 2026*
