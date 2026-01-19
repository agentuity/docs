---
name: agentuity-cli-cloud-queue-dlq-purge
description: Purge all messages from the dead letter queue. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name>"
metadata:
  command: "agentuity cloud queue dlq purge"
  tags: "mutating deletes-resource requires-auth"
---

# Cloud Queue Dlq Purge

Purge all messages from the dead letter queue

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue dlq purge <queue_name> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--confirm` | boolean | No | `false` | Skip confirmation prompt |

## Examples

Purge all DLQ messages:

```bash
bunx @agentuity/cli cloud queue dlq purge my-queue --confirm
```

## Output

Returns JSON object:

```json
{
  "success": "boolean",
  "queue_name": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | - |
| `queue_name` | string | - |
