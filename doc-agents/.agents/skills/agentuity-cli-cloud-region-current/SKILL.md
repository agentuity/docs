---
name: agentuity-cli-cloud-region-current
description: Show the current default region. Use for Agentuity cloud platform operations
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity cloud region current"
  tags: "read-only fast"
---

# Cloud Region Current

Show the current default region

## Usage

```bash
agentuity cloud region current
```

## Examples

Show default region:

```bash
bunx @agentuity/cli cloud region current
```

Show output in JSON format:

```bash
bunx @agentuity/cli cloud region current --json
```
