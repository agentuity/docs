---
name: agentuity-cli-project-auth-generate
description: Generate SQL schema for Agentuity Auth tables. Use for managing authentication credentials
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity project auth generate"
  tags: "slow"
---

# Project Auth Generate

Generate SQL schema for Agentuity Auth tables

## Prerequisites

- Project context required (run from project directory or use `--project-id`)

## Usage

```bash
agentuity project auth generate [options]
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--output` | string | Yes | - | Output path for generated SQL (default: ./agentuity-auth-schema.sql). Use "-" for stdout. |

## Examples

Generate SQL schema and save to agentuity-auth-schema.sql:

```bash
agentuity project auth generate
```

Generate schema to a custom path:

```bash
agentuity project auth generate --output ./migrations/auth.sql
```

Output SQL to stdout:

```bash
agentuity project auth generate --output -
```

## Output

Returns JSON object:

```json
{
  "success": "boolean",
  "outputPath": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether generation succeeded |
| `outputPath` | string | Path where SQL was written |
