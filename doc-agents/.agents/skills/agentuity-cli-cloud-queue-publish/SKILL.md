---
name: agentuity-cli-cloud-queue-publish
description: Publish a message to a queue. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name> <payload>"
metadata:
  command: "agentuity cloud queue publish"
  tags: "mutating creates-resource requires-auth"
---

# Cloud Queue Publish

Publish a message to a queue

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue publish <queue_name> <payload> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |
| `<payload>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--metadata` | string | Yes | - | Message metadata as JSON |
| `--partitionKey` | string | Yes | - | Partition key for ordering |
| `--idempotencyKey` | string | Yes | - | Idempotency key to prevent duplicates |
| `--ttl` | number | Yes | - | Message TTL in seconds |

## Examples

Publish a JSON message:

```bash
bunx @agentuity/cli cloud queue publish my-queue '{"task":"process"}'
```

Publish with metadata:

```bash
bunx @agentuity/cli cloud queue publish my-queue '{"task":"process"}' --metadata '{"priority":"high"}'
```

Publish with 1h TTL:

```bash
bunx @agentuity/cli cloud queue publish my-queue "hello" --ttl 3600
```

## Output

Returns JSON object:

```json
{
  "id": "string",
  "queue_id": "string",
  "offset": "number",
  "payload": "unknown",
  "size": "number",
  "metadata": "unknown",
  "state": "string",
  "idempotency_key": "unknown",
  "partition_key": "unknown",
  "ttl_seconds": "unknown",
  "delivery_attempts": "number",
  "max_retries": "number",
  "published_at": "string",
  "expires_at": "unknown",
  "delivered_at": "unknown",
  "acknowledged_at": "unknown",
  "created_at": "string",
  "updated_at": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | - |
| `queue_id` | string | - |
| `offset` | number | - |
| `payload` | unknown | - |
| `size` | number | - |
| `metadata` | unknown | - |
| `state` | string | - |
| `idempotency_key` | unknown | - |
| `partition_key` | unknown | - |
| `ttl_seconds` | unknown | - |
| `delivery_attempts` | number | - |
| `max_retries` | number | - |
| `published_at` | string | - |
| `expires_at` | unknown | - |
| `delivered_at` | unknown | - |
| `acknowledged_at` | unknown | - |
| `created_at` | string | - |
| `updated_at` | string | - |
