---
name: agentuity-cli-cloud-queue-sources-update
description: Update a source. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name> <source_id>"
metadata:
  command: "agentuity cloud queue sources update"
  tags: "mutating requires-auth"
---

# Cloud Queue Sources Update

Update a source

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue sources update <queue_name> <source_id> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |
| `<source_id>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--name` | string | Yes | - | New source name |
| `--description` | string | Yes | - | New description |
| `--auth-type` | string | Yes | - | Authentication type |
| `--auth-value` | string | Yes | - | Authentication value |
| `--enabled` | boolean | Yes | - | Enable the source |
| `--disabled` | boolean | Yes | - | Disable the source |

## Examples

Disable a source:

```bash
bunx @agentuity/cli cloud queue sources update my-queue qsrc_abc123 --disabled
```

## Output

Returns JSON object:

```json
{
  "id": "string",
  "queue_id": "string",
  "name": "string",
  "description": "unknown",
  "auth_type": "string",
  "enabled": "boolean",
  "url": "string",
  "request_count": "number",
  "success_count": "number",
  "failure_count": "number",
  "last_request_at": "unknown",
  "last_success_at": "unknown",
  "last_failure_at": "unknown",
  "last_failure_error": "unknown",
  "created_at": "string",
  "updated_at": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | - |
| `queue_id` | string | - |
| `name` | string | - |
| `description` | unknown | - |
| `auth_type` | string | - |
| `enabled` | boolean | - |
| `url` | string | - |
| `request_count` | number | - |
| `success_count` | number | - |
| `failure_count` | number | - |
| `last_request_at` | unknown | - |
| `last_success_at` | unknown | - |
| `last_failure_at` | unknown | - |
| `last_failure_error` | unknown | - |
| `created_at` | string | - |
| `updated_at` | string | - |
