---
name: agentuity-cli-cloud-queue-receive
description: Receive (claim) a message from a worker queue. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name>"
metadata:
  command: "agentuity cloud queue receive"
  tags: "read-only fast requires-auth"
---

# Cloud Queue Receive

Receive (claim) a message from a worker queue

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue receive <queue_name> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--timeout` | number | No | `30` | Visibility timeout in seconds (default: 30) |

## Examples

Receive next message:

```bash
bunx @agentuity/cli cloud queue receive my-queue
```

Receive with 60s visibility timeout:

```bash
bunx @agentuity/cli cloud queue receive my-queue --timeout 60
```

## Output

Returns JSON object:

```json
{
  "message": "unknown"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message` | unknown | - |
