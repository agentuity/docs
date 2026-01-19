---
name: agentuity-cli-auth-org-select
description: Set the default organization for all commands. Requires authentication. Use for managing authentication credentials
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "[org_id]"
metadata:
  command: "agentuity auth org select"
  tags: "fast requires-auth"
---

# Auth Org Select

Set the default organization for all commands

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity auth org select [org_id]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<org_id>` | string | No | - |

## Examples

Select default organization:

```bash
bunx @agentuity/cli auth org select
```

Set specific organization as default:

```bash
bunx @agentuity/cli auth org select org_abc123
```

## Output

Returns JSON object:

```json
{
  "orgId": "string",
  "name": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `orgId` | string | The selected organization ID |
| `name` | string | The organization name |
