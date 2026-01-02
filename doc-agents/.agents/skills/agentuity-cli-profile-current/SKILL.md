---
name: agentuity-cli-profile-current
description: Show the name of the currently active profile
version: "0.0.105"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity profile current"
  tags: "read-only fast"
---

# Profile Current

Show the name of the currently active profile

## Usage

```bash
agentuity profile current
```

## Examples

Show current profile:

```bash
agentuity profile current
```

Show output in JSON format:

```bash
agentuity profile current --json
```

## Output

Returns: `string`
