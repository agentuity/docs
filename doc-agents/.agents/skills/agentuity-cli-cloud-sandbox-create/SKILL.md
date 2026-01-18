---
name: agentuity-cli-cloud-sandbox-create
description: Create an interactive sandbox for multiple executions. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity cloud sandbox create"
  tags: "slow requires-auth"
---

# Cloud Sandbox Create

Create an interactive sandbox for multiple executions

## Prerequisites

- Authenticated with `agentuity auth login`
- Organization context required (`--org-id` or default org)

## Usage

```bash
agentuity cloud sandbox create [options]
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--runtime` | string | Yes | - | Runtime name (e.g., "bun:1", "python:3.14") |
| `--runtimeId` | string | Yes | - | Runtime ID (e.g., "srt_xxx") |
| `--name` | string | Yes | - | Sandbox name |
| `--description` | string | Yes | - | Sandbox description |
| `--memory` | string | Yes | - | Memory limit (e.g., "500Mi", "1Gi") |
| `--cpu` | string | Yes | - | CPU limit in millicores (e.g., "500m", "1000m") |
| `--disk` | string | Yes | - | Disk limit (e.g., "500Mi", "1Gi") |
| `--network` | boolean | Yes | - | Enable outbound network access |
| `--idleTimeout` | string | Yes | - | Idle timeout before sandbox is reaped (e.g., "10m", "1h") |
| `--env` | array | Yes | - | Environment variables (KEY=VALUE) |
| `--file` | array | Yes | - | Files to create in sandbox (sandbox-path:local-path) |
| `--snapshot` | string | Yes | - | Snapshot ID or tag to restore from |
| `--dependency` | array | Yes | - | Apt packages to install (can be specified multiple times) |
| `--metadata` | string | Yes | - | JSON object of user-defined metadata |
| `--port` | number | Yes | - | Port to expose from the sandbox to the outside Internet (1024-65535) |
| `--projectId` | string | Yes | - | Project ID to associate this sandbox with |

## Examples

Create a sandbox with default settings:

```bash
agentuity cloud sandbox create
```

Create a sandbox with Python runtime:

```bash
agentuity cloud sandbox create --runtime python:3.14
```

Create a sandbox with resource limits:

```bash
agentuity cloud sandbox create --memory 1Gi --cpu 1000m
```

Create a sandbox with network and custom timeout:

```bash
agentuity cloud sandbox create --network --idle-timeout 30m
```

Create a sandbox with a specific environment variable:

```bash
agentuity cloud sandbox create --env KEY=VAL
```

Create a sandbox associated with a specific project:

```bash
agentuity cloud sandbox create --project-id proj_123
```

## Output

Returns JSON object:

```json
{
  "sandboxId": "string",
  "status": "string",
  "stdoutStreamUrl": "string",
  "stderrStreamUrl": "string"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sandboxId` | string | Unique sandbox identifier |
| `status` | string | Current sandbox status |
| `stdoutStreamUrl` | string | URL to the stdout output stream |
| `stderrStreamUrl` | string | URL to the stderr output stream |
