---
name: agentuity-cli-cloud-queue-destinations-list
description: List destinations for a queue. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name>"
metadata:
  command: "agentuity cloud queue destinations list"
  tags: "read-only fast requires-auth"
---

# Cloud Queue Destinations List

List destinations for a queue

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue destinations list <queue_name>
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |

## Examples

List queue destinations:

```bash
agentuity cloud queue destinations list my-queue
```

## Output

Returns JSON object:

```json
{
  "destinations": "array"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `destinations` | array | - |
