---
name: agentuity-cli-cloud-storage-get
description: Show details about a specific storage bucket. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "<name>"
metadata:
  command: "agentuity cloud storage get"
  tags: "read-only fast requires-auth"
---

# Cloud Storage Get

Show details about a specific storage bucket

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity cloud storage get <name> [options]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<name>` | string | Yes | - |

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--showCredentials` | boolean | Yes | - | Show credentials in plain text (default: masked in terminal, unmasked in JSON) |

## Examples

Get bucket details:

```bash
agentuity cloud storage get my-bucket
```

Show bucket information:

```bash
agentuity cloud storage show my-bucket
```

Get bucket with credentials:

```bash
agentuity cloud storage get my-bucket --show-credentials
```

## Output

Returns JSON object:

```json
{
  "bucket_name": "string",
  "access_key": "string",
  "secret_key": "string",
  "region": "string",
  "endpoint": "string",
  "org_id": "string",
  "org_name": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `bucket_name` | string | Storage bucket name |
| `access_key` | string | S3 access key |
| `secret_key` | string | S3 secret key |
| `region` | string | S3 region |
| `endpoint` | string | S3 endpoint URL |
| `org_id` | string | Organization ID that owns this bucket |
| `org_name` | string | Organization name that owns this bucket |
