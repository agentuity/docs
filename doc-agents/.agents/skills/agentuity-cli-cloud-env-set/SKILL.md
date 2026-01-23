---
name: agentuity-cli-cloud-env-set
description: Set an environment variable or secret. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<key> <value>"
metadata:
  command: "agentuity cloud env set"
  tags: "mutating updates-resource slow requires-auth"
---

# Cloud Env Set

Set an environment variable or secret

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud env set <key> <value> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<key>` | string | Yes | - |
| `<value>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--secret` | boolean | No | `false` | store as a secret (encrypted and masked in UI) |
| `--org` | optionalString | Yes | - | set at organization level (use --org for default org, or --org <orgId> for specific org) |

## Examples

Set environment variable:

```bash
bunx @agentuity/cli env set NODE_ENV production
```

Set port number:

```bash
bunx @agentuity/cli env set PORT 3000
```

Set a secret value:

```bash
bunx @agentuity/cli env set API_KEY "sk_..." --secret
```

Set an organization-wide secret:

```bash
bunx @agentuity/cli env set OPENAI_API_KEY "sk_..." --secret --org
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
| `key` | string | Environment variable key |
| `path` | string | Local file path where env var was saved (project scope only) |
| `secret` | boolean | Whether the value was stored as a secret |
| `scope` | string | The scope where the variable was set |
