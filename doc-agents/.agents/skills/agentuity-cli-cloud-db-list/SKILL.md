---
name: agentuity-cli-cloud-db-list
description: List database resources. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity cloud db list"
  tags: "read-only fast requires-auth"
---

# Cloud Db List

List database resources

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud db list [options]
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--showCredentials` | boolean | Yes | - | Show credentials in plain text (default: masked in terminal, unmasked in JSON) |
| `--nameOnly` | boolean | Yes | - | Print the name only |

## Examples

List items:

```bash
agentuity cloud db list
```

Show output in JSON format:

```bash
agentuity --json cloud db list
```

List items:

```bash
agentuity cloud db ls
```

Use show credentials option:

```bash
agentuity cloud db list --show-credentials
```

## Output

Returns JSON object:

```json
{
  "databases": "array"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `databases` | array | List of database resources |
