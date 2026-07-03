# File Upload Contract

Sprint 1 defines the receipt/file upload contract separately from entity sync.

Mobile must keep receipt metadata locally even when file upload fails. Entity sync and file upload are related, but not the same worker.

## Prepare Upload

```text
POST /files/prepare-upload
```

Request:

```json
{
  "receipt_id": "receipt_x",
  "owner_entity_type": "claim_item",
  "owner_entity_id": "claim_item_x",
  "file_name": "receipt.jpg",
  "mime_type": "image/jpeg",
  "file_size": 123456
}
```

Response:

```json
{
  "upload_url": "https://signed-upload-url",
  "remote_path": "receipts/user/receipt_x.jpg",
  "headers": {
    "content-type": "image/jpeg"
  }
}
```

## Complete Upload

```text
POST /files/complete-upload
```

Request:

```json
{
  "receipt_id": "receipt_x",
  "remote_path": "receipts/user/receipt_x.jpg"
}
```

Response:

```json
{
  "receipt_id": "receipt_x",
  "remote_path": "receipts/user/receipt_x.jpg",
  "view_url": "https://signed-view-url"
}
```

## Mobile Local States

```text
local
uploading
uploaded
failed
```

## Rules

- Store the local file URI before upload starts.
- Do not mark a receipt uploaded until `complete-upload` succeeds.
- Retry failed uploads using the local receipt row.
- If the local file is missing, mark the upload as failed and keep the receipt metadata visible.
- Server validates ownership of the target entity.
- Server decides remote storage path and view URL.

