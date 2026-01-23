---
name: agentuity-cli-cloud-env-get
description: Get an environment variable or secret value. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<key>"
metadata:
  command: "agentuity cloud env get"
  tags: "read-only fast requires-auth"
---

# Cloud Env Get

Get an environment variable or secret value

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud env get <key> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<key>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--maskSecret` | boolean | Yes | - | mask the secret value in output |
| `--org` | optionalString | Yes | - | get from organization level (use --org for default org, or --org <orgId> for specific org) |

## Examples

Get environment variable:

```bash
bunx @agentuity/cli env get NODE_ENV
```

Get a secret value:

```bash
bunx @agentuity/cli env get API_KEY
```

Show unmasked value:

```bash
bunx @agentuity/cli env get API_KEY --no-mask
```

Get org-level variable:

```bash
bunx @agentuity/cli env get OPENAI_API_KEY --org
```

## Output

Returns JSON object:

```json
{
  "key": "string",
  "value": "string",
  "secret": "boolean",
  "scope": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Environment variable key name |
| `value` | string | Environment variable value |
| `secret` | boolean | Whether the value is stored as a secret |
| `scope` | string | The scope where the variable was found |
