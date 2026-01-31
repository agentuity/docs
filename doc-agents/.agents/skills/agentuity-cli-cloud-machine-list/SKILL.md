---
name: agentuity-cli-cloud-machine-list
description: List organization managed machines. Requires authentication. Use for Agentuity cloud platform operations
version: "0.1.24"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity cloud machine list"
  tags: "read-only slow requires-auth"
---

# Cloud Machine List

List organization managed machines

## Prerequisites

- Authenticated with `agentuity auth login`
- Organization context required (`--org-id` or default org)

## Usage

```bash
agentuity cloud machine list
```

## Examples

List all machines:

```bash
bunx @agentuity/cli cloud machine list
```

## Output

Returns: `array`
