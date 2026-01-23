---
name: agentuity-cli-cloud-machine-delete
description: Delete an organization managed machine. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<machine_id>"
metadata:
  command: "agentuity cloud machine delete"
  tags: "mutating destructive slow requires-auth"
---

# Cloud Machine Delete

Delete an organization managed machine

## Prerequisites

- Authenticated with `agentuity auth login`
- Organization context required (`--org-id` or default org)

## Usage

```bash
agentuity cloud machine delete <machine_id> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<machine_id>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--confirm` | boolean | No | `false` | Skip confirmation prompt |

## Examples

Delete a machine (with confirmation):

```bash
bunx @agentuity/cli cloud machine delete mach_abc123xyz
```

Delete a machine without confirmation:

```bash
bunx @agentuity/cli cloud machine delete mach_abc123xyz --confirm
```

## Output

Returns JSON object:

```json
{
  "success": "boolean",
  "machineId": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the deletion succeeded |
| `machineId` | string | The deleted machine ID |
