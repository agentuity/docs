---
name: agentuity-cli-cloud-queue-sources-get
description: Get a source by ID. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<queue_name> <source_id>"
metadata:
  command: "agentuity cloud queue sources get"
  tags: "read-only fast requires-auth"
---

# Cloud Queue Sources Get

Get a source by ID

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud queue sources get <queue_name> <source_id>
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<queue_name>` | string | Yes | - |
| `<source_id>` | string | Yes | - |

## Examples

Get source details:

```bash
bunx @agentuity/cli cloud queue sources get my-queue qsrc_abc123
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
