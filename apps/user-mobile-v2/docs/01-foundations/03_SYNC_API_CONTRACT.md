# Sync API Contract

Sprint 1 defines the mobile-facing sync contract. The implementation target is a NestJS API layer between the app and Supabase.

## Endpoints

```text
GET  /sync/bootstrap
POST /sync/push
GET  /sync/pull
```

Mobile screens must not call Supabase directly.

## Bootstrap

Used after login or fresh local database setup.

```text
GET /sync/bootstrap
```

Response:

```json
{
  "cursor": "server_cursor_x",
  "server_time": "2026-05-22T00:00:00.000Z",
  "payload": {
    "profile": {},
    "subscription": {},
    "spaces": [],
    "rate_versions": [],
    "usage_counters": {}
  }
}
```

## Push

Used to send queued local mutations.

```text
POST /sync/push
```

Request:

```json
{
  "device_id": "device_x",
  "client_time": "2026-05-22T00:00:00.000Z",
  "items": [
    {
      "queue_id": "sync_x",
      "entity_type": "claim_item",
      "entity_id": "claim_item_x",
      "operation": "create",
      "client_updated_at": "2026-05-22T00:00:00.000Z",
      "payload": {}
    }
  ]
}
```

Response:

```json
{
  "accepted": [
    {
      "queue_id": "sync_x",
      "entity_type": "claim_item",
      "entity_id": "claim_item_x",
      "server_updated_at": "2026-05-22T00:00:01.000Z"
    }
  ],
  "rejected": [
    {
      "queue_id": "sync_y",
      "entity_type": "claim",
      "entity_id": "claim_y",
      "code": "CLAIM_LOCKED",
      "message": "Submitted claims cannot be edited."
    }
  ]
}
```

## Pull

Used to fetch server-side changes after the last known cursor.

```text
GET /sync/pull?cursor=server_cursor_x
```

Response:

```json
{
  "cursor": "server_cursor_y",
  "changes": [
    {
      "entity_type": "claim",
      "entity_id": "claim_x",
      "operation": "upsert",
      "server_updated_at": "2026-05-22T00:00:01.000Z",
      "payload": {}
    }
  ]
}
```

## Server Rules

- Validate Supabase JWT on every request.
- Enforce user/org ownership.
- Enforce subscription and feature gates server-side.
- Treat push items as idempotent by `queue_id` and `entity_id`.
- Reject submitted-claim edits with a typed conflict code.
- Return only authorized records in pull/bootstrap responses.
- Never trust mobile totals for submitted/approved financial state.

