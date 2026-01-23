---
name: agentuity-cli-cloud-sandbox-snapshot-create
description: Create a snapshot from a sandbox. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<sandboxId>"
metadata:
  command: "agentuity cloud sandbox snapshot create"
  tags: "slow requires-auth"
---

# Cloud Sandbox Snapshot Create

Create a snapshot from a sandbox

## Prerequisites

- Authenticated with `agentuity auth login`
- Organization context required (`--org-id` or default org)

## Usage

```bash
agentuity cloud sandbox snapshot create <sandboxId> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<sandboxId>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--name` | string | Yes | - | Display name for the snapshot (letters, numbers, underscores, dashes only) |
| `--description` | string | Yes | - | Description of the snapshot |
| `--tag` | string | Yes | - | Tag for the snapshot (defaults to "latest") |
| `--public` | boolean | No | `false` | Make the snapshot publicly accessible |

## Examples

Create a snapshot from a sandbox:

```bash
bunx @agentuity/cli cloud sandbox snapshot create sbx_abc123
```

Create a tagged snapshot:

```bash
bunx @agentuity/cli cloud sandbox snapshot create sbx_abc123 --tag latest
```

Create a named snapshot with description:

```bash
bunx @agentuity/cli cloud sandbox snapshot create sbx_abc123 --name "My Snapshot" --description "Initial setup"
```

Create a public snapshot:

```bash
bunx @agentuity/cli cloud sandbox snapshot create sbx_abc123 --public
```

## Output

Returns JSON object:

```json
{
  "snapshotId": "string",
  "name": "string",
  "description": "unknown",
  "tag": "unknown",
  "sizeBytes": "number",
  "fileCount": "number",
  "createdAt": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `snapshotId` | string | Snapshot ID |
| `name` | string | Snapshot display name |
| `description` | unknown | Snapshot description |
| `tag` | unknown | Snapshot tag (defaults to "latest") |
| `sizeBytes` | number | Snapshot size in bytes |
| `fileCount` | number | Number of files in snapshot |
| `createdAt` | string | Snapshot creation timestamp |
