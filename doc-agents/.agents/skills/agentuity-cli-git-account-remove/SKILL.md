---
name: agentuity-cli-git-account-remove
description: Remove a GitHub account from your organization. Requires authentication
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity git account remove"
  tags: "mutating destructive slow"
---

# Git Account Remove

Remove a GitHub account from your organization

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity git account remove [options]
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--org` | string | Yes | - | Organization ID |
| `--account` | string | Yes | - | GitHub integration ID to remove |
| `--confirm` | boolean | Yes | - | Skip confirmation prompt |

## Examples

Remove a GitHub account from your organization:

```bash
bunx @agentuity/cli git account remove
```

Remove a specific account without prompts:

```bash
bunx @agentuity/cli git account remove --org org_abc --account int_xyz --confirm
```

Remove and return JSON result:

```bash
bunx @agentuity/cli --json git account remove --org org_abc --account int_xyz --confirm
```

## Output

Returns JSON object:

```json
{
  "removed": "boolean",
  "orgId": "string",
  "integrationId": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `removed` | boolean | Whether the account was removed |
| `orgId` | string | Organization ID |
| `integrationId` | string | Integration ID that was removed |
