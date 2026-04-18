# myexpensio User Guide (apps/user)

Based on the user app screens and supporting export/API logic in the repository snapshot `feaaaa44610acd3805dd8b8349d8ba54bb6d42e0`.

## 1. What myexpensio does

myexpensio is a user-facing mileage and expense claim app. It helps a staff member:

- capture trips using one of **3 trip methods**,
- group trips and expenses into a claim period,
- add all supported claim item types,
- import and review **Touch ’n Go (TNG)** statement transactions,
- link eligible TNG rows to claim items,
- export claims to **CSV, XLSX, and PDF**,
- generate a more audit-ready PDF with **receipt appendix** and **highlighted TNG statement appendix**.

## 2. Main user workflow

A practical day-to-day flow is:

1. **Record trips daily** using GPS, route planning, or odometer.
2. **Open / create a claim** for the month or date range.
3. **Pull eligible trips into the claim** as mileage items.
4. **Add non-mileage expenses** such as meals, toll, parking, lodging, transport, per diem, and misc.
5. **Upload TNG statement** and review imported transactions.
6. **Link TNG rows** to toll / parking claim items where relevant.
7. **Review totals and submission status**.
8. **Export** to CSV, XLSX, or PDF.

## 3. Trips: the 3 trip entry options

### A. Start Trip (live trip)
Use this when the trip is happening now.

Typical use:
- start from your current location,
- let the app capture the live trip,
- stop the trip when you arrive,
- review it later from the Trips list.

Best for:
- real field visits,
- sales / service runs,
- situations where you want the most defensible trip capture.

### B. Plan Trip (route-based mileage)
Use this when you know the route but are not live-tracking.

Typical use:
- enter start and destination,
- let the app estimate route distance,
- save it as a trip record,
- convert it into a mileage claim item later.

Best for:
- pre-planned travel,
- repeating routes,
- after-the-fact entry where the route is known.

### C. Odometer (manual start/end reading)
Use this when you want mileage based on odometer readings.

Typical use:
- enter opening odometer,
- enter closing odometer,
- the app computes the trip distance,
- save it for later claim conversion.

Best for:
- vehicles where odometer proof is preferred,
- manual mileage workflows,
- fallback when GPS or route estimation is not suitable.

## 4. Daily update routine for users

A good user routine is:

- **Before or during travel:** create the trip using the most suitable trip mode.
- **At the end of the day:** open **Trips** and confirm the day’s records are complete.
- **When receipts are available:** add the expense items into the current claim on the same day.
- **When TNG is used:** upload or refresh your statement and link the matching toll / parking rows.
- **At month end (or claim cutoff):** review the claim, then submit and export.

This keeps the claim nearly complete every day instead of rebuilding it at month end.

## 5. Claims

### 5.1 Create a claim
A claim is the main container for a reporting period, usually a month or a custom start/end date.

Typical fields:
- claim title,
- period start,
- period end,
- draft / submitted state.

Use one claim per reporting cycle to keep trips, receipts, and TNG links together.

### 5.2 Claim statuses

- **Draft**: you can keep adding or editing items.
- **Submitted**: ready for approval/export flow and generally treated as locked or final from the user side.

### 5.3 All supported claim item types

myexpensio supports these user claim item types:

- **MILEAGE**
- **MEAL**
- **LODGING**
- **TOLL**
- **PARKING**
- **TAXI**
- **GRAB**
- **TRAIN**
- **FLIGHT**
- **BUS**
- **PER_DIEM**
- **MISC**

### 5.4 How each claim type is typically used

#### Mileage
- Usually created from saved trips.
- Distance / qty / rate are calculated into amount.
- Best used for private vehicle work travel.

#### Meal
- Food claim for eligible sessions or working travel.
- Usually includes merchant, meal session, notes, receipt, and amount / rate logic.

#### Lodging
- Accommodation / hotel stay.
- Usually includes merchant, nights, rate, receipt, and amount.

#### Toll
- Road toll charge.
- Strongly integrated with TNG import and statement linking.

##### Parking
- Parking charge.
- Also strongly integrated with TNG import and statement linking.

#### Taxi / Grab / Train / Flight / Bus
- Public or hired transport.
- Use these when travel is not private mileage.
- Depending on policy, attach receipt and add notes / merchant / fare details.

#### Per Diem
- Daily allowance style claim.
- Usually driven by approved rate and number of days / destination.

#### Misc
- Any valid reimbursable expense that does not fit the predefined buckets.

### 5.5 Building a claim step by step

1. Create the claim for the period.
2. Add mileage by selecting saved trips.
3. Add non-mileage items one by one.
4. Attach receipts where needed.
5. Link TNG rows for toll / parking where applicable.
6. Review totals.
7. Submit the claim.

## 6. Trips inside claims

One of the strongest user flows is that trip capture and claim preparation are connected.

Instead of retyping mileage manually, the user can:
- record trips first,
- then bring those trips into a claim,
- letting mileage become more structured and traceable.

This reduces missing trip records and makes the claim easier to audit later.

## 7. TNG statement workflow

### 7.1 What TNG is used for
The TNG module is for importing statement rows from the user’s Touch ’n Go statement and using them as evidence / source transactions for claims.

### 7.2 Typical TNG workflow

1. Open the **TNG** section.
2. Upload the TNG statement file.
3. Let the app parse and store statement transactions.
4. Review the imported rows in **Transactions**.
5. Link eligible rows to claim items, especially **TOLL** and **PARKING**.
6. Export the final claim with the linked TNG evidence.

### 7.3 Why TNG linking matters
TNG linking reduces manual re-entry and creates a stronger audit trail:
- the claim item exists,
- the source transaction exists,
- the exported PDF can include the original statement pages with highlighted transaction numbers.

## 8. Transactions

The **Transactions** screen acts as the review layer for imported statement data.

Use it to:
- review imported rows,
- see transaction details,
- identify linked vs not-yet-linked rows,
- connect eligible statement rows to claim items.

For users, this is especially useful after importing a new TNG statement, because it becomes the control centre for reconciliation.

## 9. Export

myexpensio supports:

- **CSV**
- **XLSX**
- **PDF**

### 9.1 CSV export
Best for:
- finance checking,
- quick spreadsheet review,
- downstream processing.

### 9.2 XLSX export
Best for:
- formatted spreadsheet review,
- finance operations,
- internal manipulation and reconciliation.

### 9.3 PDF export
Best for:
- formal submission,
- printing,
- approval packs,
- archiving.

### 9.4 PDF special features
The PDF generator supports layout options such as:
- portrait / landscape,
- grouping by date or by category,
- summary table,
- declaration section,
- receipt appendix,
- **TNG appendix**.

The TNG appendix is especially valuable because the export pipeline can:
- collect linked TNG transaction numbers,
- append the original TNG statement PDF,
- **highlight the linked transaction numbers** inside the appended statement pages.

That is a major differentiator for audit-readiness.

## 10. Killer features of myexpensio (user app)

#### 1. Three ways to record mileage
Users are not forced into one method. They can choose:
- live trip,
- planned route,
- odometer reading.

This makes the app usable across many real-world travel habits.

#### 2. Trips first, claims second
The app separates trip capture from claim submission. That means users can record movement daily, then turn those records into claims later.

#### 3. Claim types cover real field-work expenses
The supported claim types cover the normal reimbursement reality of out-of-office staff: mileage, toll, parking, meals, lodging, transport, per diem, and misc.

#### 4. TNG-native workflow
TNG is not treated as a simple attachment. The app stores statement transactions and links them to claim items.

#### 5. Audit-ready PDF with statement highlighting
This is one of the strongest features in the whole app:
- receipts can be appended,
- TNG statements can be appended,
- relevant TNG transaction numbers can be highlighted in the exported PDF.

#### 6. Better daily discipline for users
Because trips, claims, transactions, and exports are connected, users can update the app daily instead of waiting until the end of the month.

#### 7. Better evidence quality for approvers
Claims are easier to verify because they can be traced back to trips, receipts, and linked TNG source rows.

## 11. Best-practice user guidance

- Use **Start Trip** for real live field trips.
- Use **Plan Trip** for known routes.
- Use **Odometer** when vehicle reading is the official basis.
- Update trips and expenses **the same day** whenever possible.
- Upload TNG statements early, not only at month end.
- Link toll / parking rows before export.
- Use PDF export when you need the most complete supporting package.

## 12. One-line positioning

**myexpensio is not just a claim form; it is a trip-to-claim-to-evidence workflow for mobile staff.**
