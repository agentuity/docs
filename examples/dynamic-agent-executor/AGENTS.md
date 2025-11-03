# Agents

## dynamic-executor

Execute TypeScript agent code dynamically using `vm.runInNewContext`.

### Description

This agent accepts TypeScript code as input and executes it in a sandboxed environment. It provides TypeScript transpilation, script caching, rate limiting, namespace isolation, and security hardening.

### Input

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

### Output

The output depends on what the dynamic agent code returns. Typically:

```json
{
  "contentType": "application/json",
  "payload": { ... }
}
```

### Example

```bash
curl -X POST http://localhost:3500/dynamic-executor \
  -H "Content-Type: application/json" \
  -d '{
    "code": "async function Agent(req, resp, ctx) { const input = await req.data.text(); return resp.json({ message: \"Hello: \" + input }); }",
    "data": "World"
  }'
```

### Security Considerations

- Only execute trusted code
- VM sandboxing is not a security boundary
- Rate limits prevent resource exhaustion
- Namespace isolation prevents data collision
