---
name: agentuity-cli-profile-use
description: Switch to a different configuration profile
version: "0.0.105"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
argument-hint: "[name]"
metadata:
  command: "agentuity profile use"
  tags: "mutating updates-resource fast"
---

# Profile Use

Switch to a different configuration profile

## Usage

```bash
agentuity profile use [name]
```

## Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<name>` | string | No | - |

## Examples

Switch to the "production" profile:

```bash
agentuity profile use production
```

Switch to the "staging" profile:

```bash
agentuity profile switch staging
```

Show interactive profile selection menu:

```bash
agentuity profile use
```
