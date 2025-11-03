# Dynamic Agent Executor

Execute TypeScript agent code dynamically using `vm.runInNewContext` without rebuilding or redeploying.

## Overview

This agent accepts TypeScript code as input and executes it in a sandboxed environment. It provides:

- **TypeScript transpilation** via Bun.Transpiler
- **Sandboxed execution** with vm.runInNewContext
- **Script caching** by content hash (SHA-256)
- **Rate limiting** for KV/Vector operations
- **Namespace isolation** for storage
- **Security hardening** (blocked globals, allowlisted modules)

## Installation

```bash
bun install
```

## Usage

### Start the agent locally

```bash
agentuity dev
```

### Send a request

```bash
curl -X POST http://localhost:3500/dynamic-executor \
  -H "Content-Type: application/json" \
  -d '{
    "code": "async function Agent(req, resp, ctx) { const input = await req.data.text(); return resp.json({ message: \"Hello: \" + input }); }",
    "data": "World"
  }'
```

## Input Format

```json
{
  "code": "async function Agent(req, resp, ctx) { ... }",
  "data": "input data for the dynamic agent",
  "agentName": "my-agent",
  "timeout": 200,
  "maxKVOps": 100,
  "maxVectorOps": 50
}
```

### Fields

- **code** (required): TypeScript/JavaScript code defining an `Agent` function
- **data** (optional): Input data to pass to the dynamic agent
- **agentName** (optional): Name for namespacing storage operations (default: "dynamic")
- **timeout** (optional): VM execution timeout in ms (default: 200)
- **maxKVOps** (optional): Max KV operations allowed (default: 100)
- **maxVectorOps** (optional): Max Vector operations allowed (default: 50)

## Examples

### Simple Echo Agent

```json
{
  "code": "async function Agent(req, resp, ctx) { const input = await req.data.text(); return resp.json({ message: 'Echo: ' + input }); }",
  "data": "Hello, World!"
}
```

### Agent with KV Storage

```json
{
  "code": "async function Agent(req, resp, ctx) { const input = await req.data.text(); await ctx.kv.set('messages', 'last', input); const last = await ctx.kv.get('messages', 'last'); return resp.json({ input, stored: true }); }",
  "data": "Store this message"
}
```

### TypeScript Agent with Types

```json
{
  "code": "async function Agent(req: any, resp: any, ctx: any): Promise<any> {\n  const input: string = await req.data.text();\n  \n  interface Result {\n    success: boolean;\n    message: string;\n    timestamp: string;\n  }\n  \n  const result: Result = {\n    success: true,\n    message: `Processed: ${input}`,\n    timestamp: new Date().toISOString()\n  };\n  \n  return resp.json(result);\n}",
  "data": "Test input"
}
```

## Security Features

### Sandboxing
- Blocked globals: `process`, `global`, `globalThis`, `Buffer`, `eval`, `Function`
- Allowed: `console` (proxied), `Promise`, `setTimeout`, `Date`, `JSON`, `Math`

### Rate Limiting
- KV operations: 100 per execution (configurable)
- Vector operations: 50 per execution (configurable)

### Namespace Isolation
- All storage operations are prefixed: `dyn/{agentName}/{storeName}`
- Prevents collision with production data

### Caching
- Compiled scripts are cached by content hash (SHA-256)
- Subsequent executions of the same code are instant

## Limitations

1. **Timeout**: Only applies to synchronous code execution, not async operations
2. **No imports**: Cannot use `import` statements (provide dependencies via allowModules if needed)
3. **VM Security**: `vm.runInNewContext` is not a security boundary - use for trusted code only
4. **Memory**: No memory limits enforced (consider adding for production)

## License

MIT
