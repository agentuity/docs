---
name: agentuity-cli-cloud-queue-delete
description: Delete a queue by name. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<name>"
metadata:
  command: "agentuity cloud queue delete"
  tags: "mutating deletes-resource requires-auth"
---

# Cloud Queue Delete

Delete a queue by name

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue delete <name> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<name>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--confirm` | boolean | No | `false` | Skip confirmation prompt |

## Examples

Delete a queue (requires confirmation):

```bash
bunx @agentuity/cli cloud queue delete my-queue --confirm
```

## Output

Returns JSON object:

```json
{
  "success": "boolean",
  "name": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | - |
| `name` | string | - |
