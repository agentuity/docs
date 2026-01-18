---
name: agentuity-cli-auth-login
description: "Login to the Agentuity Platform using a browser-based authentication flow. Use for managing authentication credentials"
version: "0.1.20"
license: Apache-2.0
allowed-tools: "Bash(agentuity:*)"
metadata:
  command: "agentuity auth login"
  tags: "mutating creates-resource slow api-intensive"
---

# Auth Login

Login to the Agentuity Platform using a browser-based authentication flow

## Usage

```bash
agentuity auth login [options]
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--setupToken` | string | Yes | - | Use a one-time use setup token |

## Examples

Login to account:

```bash
agentuity auth login
```

Login to account:

```bash
agentuity login
```

## Output

Returns JSON object:

```json
{
  "success": "boolean"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | - |
