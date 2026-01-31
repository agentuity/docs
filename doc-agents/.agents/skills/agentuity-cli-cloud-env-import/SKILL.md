---
name: agentuity-cli-cloud-env-import
description: Import environment variables and secrets from a file to cloud and local .env. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<file>"
metadata:
  command: "agentuity cloud env import"
  tags: "mutating creates-resource slow api-intensive requires-auth"
---

# Cloud Env Import

Import environment variables and secrets from a file to cloud and local .env

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud env import <file> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<file>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--org` | optionalString | Yes | - | import to organization level (use --org for default org) |

## Examples

Import variables from backup file:

```bash
bunx @agentuity/cli cloud env import .env.backup
```

Import from .env.local file:

```bash
bunx @agentuity/cli cloud env import .env.local
```

Import to organization level:

```bash
bunx @agentuity/cli cloud env import .env.shared --org
```

## Output

Returns JSON object:

```json
{
  "success": "boolean",
  "imported": "number",
  "envCount": "number",
  "secretCount": "number",
  "skipped": "number",
  "path": "string",
  "file": "string",
  "scope": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether import succeeded |
| `imported` | number | Number of items imported |
| `envCount` | number | Number of env vars imported |
| `secretCount` | number | Number of secrets imported |
| `skipped` | number | Number of items skipped |
| `path` | string | Local file path where variables were saved (project scope only) |
| `file` | string | Source file path |
| `scope` | string | The scope where variables were imported |
