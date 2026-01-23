---
name: agentuity-cli-cloud-env-delete
description: Delete an environment variable or secret. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<key>"
metadata:
  command: "agentuity cloud env delete"
  tags: "destructive deletes-resource slow requires-auth"
---

# Cloud Env Delete

Delete an environment variable or secret

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud env delete <key> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<key>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--org` | optionalString | Yes | - | delete from organization level (use --org for default org, or --org <orgId> for specific org) |

## Examples

Delete variable:

```bash
bunx @agentuity/cli env delete OLD_FEATURE_FLAG
```

Delete a secret:

```bash
bunx @agentuity/cli env rm API_KEY
```

Delete org-level secret:

```bash
bunx @agentuity/cli env rm OPENAI_API_KEY --org
```

## Output

Returns JSON object:

```json
{
  "success": "boolean",
  "key": "string",
  "path": "string",
  "secret": "boolean",
  "scope": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the operation succeeded |
| `key` | string | Variable key that was deleted |
| `path` | string | Local file path where variable was removed (project scope only) |
| `secret` | boolean | Whether a secret was deleted |
| `scope` | string | The scope from which the variable was deleted |
