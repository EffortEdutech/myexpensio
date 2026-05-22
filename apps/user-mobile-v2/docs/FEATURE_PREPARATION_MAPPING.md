# Feature Preparation Mapping

Sprint 1 prepares the data and sync shape for later feature sprints without building all final screens.

## Trips And Mileage

Local tables:

```text
trips
trip_points
routes_cache
receipts
claim_items
```

Lifecycle:

```text
Start trip
-> create local trip with status active
-> collect local trip_points
-> stop trip
-> calculate provisional distance
-> queue trip and point sync
-> server finalizes distance/source
-> create mileage claim item when user adds trip to claim
```

Distance sources:

```text
GPS
selected_route
odometer_override
```

GPS permission flow:

```text
request foreground location permission
-> explain why trip tracking needs location
-> collect points only while active trip is running
-> degrade to manual/odometer flow if denied
```

Odometer flow:

```text
capture odometer photo metadata
-> store receipt/photo row
-> user enters odometer distance
-> queue trip update
```

Route alternatives:

```text
origin/destination
-> check routes_cache
-> request alternatives from API when online
-> store selected route on trip
```

## TNG

Local tables:

```text
tng_transactions
claim_items
receipts
sync_queue
```

Import lifecycle:

```text
upload statement
-> server parses statement
-> pull parsed transactions
-> store local transactions
-> user links transaction to claim item
```

Link behavior:

```text
claim_item.tng_transaction_id = tng_transaction.id
tng_transactions.claimed = true
tng_transactions.claim_item_id = claim_item.id
```

Unlink behavior:

```text
clear claim item TNG fields
mark transaction unclaimed
queue both mutations
```

Duplicate policy:

```text
server owns duplicate detection using transaction number, date, amount, statement id, and user/org scope
```

Export appendix:

```text
export builder reads linked TNG transactions and source statement metadata
```

## Personal Expense

Local tables:

```text
spaces
ledger_entries
commitments
commitment_payments
receipts
```

Personal expense mapping:

```text
personal expense = ledger_entries row
space.type = personal
entry_type = expense
```

Bills/commitments:

```text
commitments stores recurring or tracked obligation
commitment_payments stores payment events
receipts stores documents
```

Tax report cache:

```text
personal tax report is server-calculated or locally summarized from ledger_entries when offline
server remains final source for exported report
```

## Business Space

Local tables:

```text
spaces
ledger_entries
receipts
subscriptions_cache
```

Business income:

```text
ledger_entries.entry_type = income
space.type = business
```

Business expense:

```text
ledger_entries.entry_type = expense
space.type = business
```

Reports:

```text
profit summary = income - expenses
business tax report = server-finalized aggregation
```

Premium gate:

```text
subscriptions_cache.tier must allow business_space
server remains authoritative for final access checks
```

