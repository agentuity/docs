---
name: agentuity-cli-cloud-env-pull
description: Pull environment variables from cloud to local .env file. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity cloud env pull"
  tags: "slow requires-auth"
---

# Cloud Env Pull

Pull environment variables from cloud to local .env file

## Prerequisites

- Authenticated with `agentuity auth login`
- cloud deploy

## Usage

```bash
agentuity cloud env pull [options]
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--force` | boolean | No | `false` | overwrite local values with cloud values |
| `--org` | optionalString | Yes | - | pull from organization level (use --org for default org) |

## Examples

Pull from project:

```bash
bunx @agentuity/cli env pull
```

Overwrite local with cloud values:

```bash
bunx @agentuity/cli env pull --force
```

Pull from organization:

```bash
bunx @agentuity/cli env pull --org
```

## Output

Returns JSON object:

```json
{
  "success": "boolean",
  "pulled": "number",
  "path": "string",
  "force": "boolean",
  "scope": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether pull succeeded |
| `pulled` | number | Number of items pulled |
| `path` | string | Local file path where variables were saved |
| `force` | boolean | Whether force mode was used |
| `scope` | string | The scope from which variables were pulled |
