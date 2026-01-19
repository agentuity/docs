---
name: agentuity-cli-cloud-region-select
description: Set the default cloud region for all commands. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "[region]"
metadata:
  command: "agentuity cloud region select"
  tags: "fast requires-auth"
---

# Cloud Region Select

Set the default cloud region for all commands

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud region select [region]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<region>` | string | No | - |

## Examples

Select default region:

```bash
bunx @agentuity/cli cloud region select
```

Set specific region as default:

```bash
bunx @agentuity/cli cloud region select usc
```

## Output

Returns JSON object:

```json
{
  "region": "string",
  "description": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `region` | string | The selected region code |
| `description` | string | The region description |
