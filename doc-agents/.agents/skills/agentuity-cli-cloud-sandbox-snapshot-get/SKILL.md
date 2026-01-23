---
name: agentuity-cli-cloud-sandbox-snapshot-get
description: Get snapshot details. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<snapshotId>"
metadata:
  command: "agentuity cloud sandbox snapshot get"
  tags: "slow requires-auth"
---

# Cloud Sandbox Snapshot Get

Get snapshot details

## Prerequisites

- Authenticated with `agentuity auth login`
- Organization context required (`--org-id` or default org)

## Usage

```bash
agentuity cloud sandbox snapshot get <snapshotId>
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<snapshotId>` | string | Yes | - |

## Examples

Get details for a snapshot:

```bash
bunx @agentuity/cli cloud sandbox snapshot get snp_abc123
```

## Output

Returns JSON object:

```json
{
  "snapshotId": "string",
  "name": "string",
  "fullName": "string",
  "tag": "unknown",
  "message": "unknown",
  "sizeBytes": "number",
  "fileCount": "number",
  "parentSnapshotId": "unknown",
  "public": "boolean",
  "orgName": "string",
  "orgSlug": "string",
  "createdAt": "string",
  "downloadUrl": "string",
  "files": "unknown",
  "userMetadata": "unknown",
  "sandboxes": "array"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `snapshotId` | string | Snapshot ID |
| `name` | string | Snapshot name |
| `fullName` | string | Full name with org slug (@slug/name:tag) |
| `tag` | unknown | Snapshot tag |
| `message` | unknown | Build message |
| `sizeBytes` | number | Snapshot size in bytes |
| `fileCount` | number | Number of files |
| `parentSnapshotId` | unknown | Parent snapshot ID |
| `public` | boolean | Whether snapshot is publicly accessible |
| `orgName` | string | Organization name (for public snapshots) |
| `orgSlug` | string | Organization slug (for public snapshots) |
| `createdAt` | string | Creation timestamp |
| `downloadUrl` | string | Presigned download URL |
| `files` | unknown | Files in snapshot |
| `userMetadata` | unknown | User-defined metadata |
| `sandboxes` | array | Attached sandboxes (idle or running) |
