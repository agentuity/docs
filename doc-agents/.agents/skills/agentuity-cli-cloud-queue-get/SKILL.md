---
name: agentuity-cli-cloud-queue-get
description: Get queue or message details. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name> [message_id]"
metadata:
  command: "agentuity cloud queue get"
  tags: "read-only fast requires-auth"
---

# Cloud Queue Get

Get queue or message details

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue get <queue_name> [message_id]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |
| `<message_id>` | string | No | - |

## Examples

Get queue details:

```bash
bunx @agentuity/cli cloud queue get my-queue
```

Get message details:

```bash
bunx @agentuity/cli cloud queue get my-queue msg_abc123
```
