---
name: agentuity-cli-cloud-queue-destinations-delete
description: Delete a destination from a queue. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name> <destination_id>"
metadata:
  command: "agentuity cloud queue destinations delete"
  tags: "mutating deletes-resource requires-auth"
---

# Cloud Queue Destinations Delete

Delete a destination from a queue

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue destinations delete <queue_name> <destination_id>
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |
| `<destination_id>` | string | Yes | - |

## Examples

Delete a destination:

```bash
bunx @agentuity/cli cloud queue destinations delete my-queue dest-123
```

## Output

Returns JSON object:

```json
{
  "success": "boolean",
  "queue_name": "string",
  "destination_id": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | - |
| `queue_name` | string | - |
| `destination_id` | string | - |
