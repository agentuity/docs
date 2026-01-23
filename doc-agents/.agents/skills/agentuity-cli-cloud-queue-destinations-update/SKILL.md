---
name: agentuity-cli-cloud-queue-destinations-update
description: Update a destination. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name> <destination_id>"
metadata:
  command: "agentuity cloud queue destinations update"
  tags: "mutating requires-auth"
---

# Cloud Queue Destinations Update

Update a destination

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue destinations update <queue_name> <destination_id> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |
| `<destination_id>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--url` | string | Yes | - | Webhook URL |
| `--method` | string | Yes | - | HTTP method |
| `--timeout` | number | Yes | - | Request timeout in milliseconds |
| `--enabled` | boolean | Yes | - | Enable the destination |
| `--disabled` | boolean | Yes | - | Disable the destination |

## Examples

Disable a destination:

```bash
bunx @agentuity/cli cloud queue destinations update my-queue dest_abc123 --disabled
```

## Output

Returns JSON object:

```json
{
  "id": "string",
  "queue_id": "string",
  "destination_type": "string",
  "config": "object",
  "enabled": "boolean",
  "stats": "object",
  "created_at": "string",
  "updated_at": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | - |
| `queue_id` | string | - |
| `destination_type` | string | - |
| `config` | object | - |
| `enabled` | boolean | - |
| `stats` | object | - |
| `created_at` | string | - |
| `updated_at` | string | - |
