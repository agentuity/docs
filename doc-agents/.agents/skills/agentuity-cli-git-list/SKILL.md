---
name: agentuity-cli-git-list
description: List GitHub repositories accessible to your organization. Requires authentication
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity git list"
  tags: "read-only"
---

# Git List

List GitHub repositories accessible to your organization

## Prerequisites

- Authenticated with `agentuity auth login`

## Usage

```bash
agentuity git list [options]
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--org` | string | Yes | - | Organization ID to list repos for |
| `--account` | string | Yes | - | GitHub account/integration ID to filter by |

## Examples

List all accessible GitHub repositories:

```bash
agentuity git list
```

List repos for a specific organization:

```bash
agentuity git list --org org_abc123
```

List repos in JSON format:

```bash
agentuity --json git list
```
