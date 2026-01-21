---
name: agentuity-cli-cloud-queue-messages
description: List messages in a queue or get a specific message. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name> [message_id]"
metadata:
  command: "agentuity cloud queue messages"
  tags: "read-only fast requires-auth"
---

# Cloud Queue Messages

List messages in a queue or get a specific message

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue messages <queue_name> [message_id] [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |
| `<message_id>` | string | No | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--limit` | number | Yes | - | Maximum number of messages to return |
| `--offset` | number | Yes | - | Offset for pagination |

## Examples

List messages in a queue:

```bash
bunx @agentuity/cli cloud queue messages my-queue
```

List first 10 messages:

```bash
bunx @agentuity/cli cloud queue messages my-queue --limit 10
```

Get a specific message by ID:

```bash
bunx @agentuity/cli cloud queue messages my-queue msg_abc123
```
