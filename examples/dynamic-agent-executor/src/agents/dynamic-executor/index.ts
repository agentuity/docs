import type { AgentRequest, AgentResponse, AgentContext } from '@agentuity/sdk';
import vm from 'node:vm';
import crypto from 'node:crypto';

/**
 * Dynamic Agent Executor
 * 
 * This agent accepts TypeScript code and executes it dynamically.
 * 
 * Input format:
 * {
 *   "code": "async function Agent(req, resp, ctx) { ... }",
 *   "data": "input data for the dynamic agent"
 * }
 */

// Compute SHA-256 hash for caching
function computeCodeHash(source: string): string {
  return crypto.createHash('sha256').update(source).digest('hex');
}

// Create allowlisted require function
function createSafeRequire(allowlist: Record<string, any>) {
  return (moduleName: string) => {
    if (!(moduleName in allowlist)) {
      throw new Error(`Module not allowed: ${moduleName}`);
    }
    return allowlist[moduleName];
  };
}

// Harden context with rate limiting and namespacing
function hardenContext(
  ctx: AgentContext,
  opts: { agentName: string; codeHash: string; maxKVOps?: number; maxVectorOps?: number }
): AgentContext {
  let kvOpsCount = 0;
  let vectorOpsCount = 0;
  
  const maxKV = opts.maxKVOps || 100;
  const maxVector = opts.maxVectorOps || 50;
  
  const logger = {
    trace: (...args: any[]) => ctx.logger?.trace?.(`[dynamic:${opts.agentName}]`, ...args),
    debug: (...args: any[]) => ctx.logger?.debug?.(`[dynamic:${opts.agentName}]`, ...args),
    info: (...args: any[]) => ctx.logger?.info?.(`[dynamic:${opts.agentName}]`, ...args),
    warn: (...args: any[]) => ctx.logger?.warn?.(`[dynamic:${opts.agentName}]`, ...args),
    error: (...args: any[]) => ctx.logger?.error?.(`[dynamic:${opts.agentName}]`, ...args),
  };
  
  const kv = {
    get: async (name: string, key: string) => {
      if (++kvOpsCount > maxKV) throw new Error(`KV ops limit: ${maxKV}`);
      return ctx.kv?.get(`dyn/${opts.agentName}/${name}`, key);
    },
    set: async (name: string, key: string, value: any, params?: any) => {
      if (++kvOpsCount > maxKV) throw new Error(`KV ops limit: ${maxKV}`);
      return ctx.kv?.set(`dyn/${opts.agentName}/${name}`, key, value, params);
    },
    delete: async (name: string, key: string) => {
      if (++kvOpsCount > maxKV) throw new Error(`KV ops limit: ${maxKV}`);
      return ctx.kv?.delete(`dyn/${opts.agentName}/${name}`, key);
    },
  };
  
  const vector = {
    upsert: async (name: string, ...docs: any[]) => {
      if (++vectorOpsCount > maxVector) throw new Error(`Vector ops limit: ${maxVector}`);
      return ctx.vector?.upsert(`dyn/${opts.agentName}/${name}`, ...docs);
    },
    search: async (name: string, params: any) => {
      if (++vectorOpsCount > maxVector) throw new Error(`Vector ops limit: ${maxVector}`);
      return ctx.vector?.search(`dyn/${opts.agentName}/${name}`, params);
    },
    delete: async (name: string, ...ids: string[]) => {
      if (++vectorOpsCount > maxVector) throw new Error(`Vector ops limit: ${maxVector}`);
      return ctx.vector?.delete(`dyn/${opts.agentName}/${name}`, ...ids);
    },
  };
  
  return Object.freeze({ ...ctx, logger, kv, vector, tracer: undefined }) as AgentContext;
}

// Create minimal sandbox
function createSandbox(opts: { allowModules: Record<string, any>; logger: any }) {
  return vm.createContext({
    console: {
      log: (...args: any[]) => opts.logger?.info('[dynamic]', ...args),
      error: (...args: any[]) => opts.logger?.error('[dynamic]', ...args),
      warn: (...args: any[]) => opts.logger?.warn('[dynamic]', ...args),
      debug: (...args: any[]) => opts.logger?.debug('[dynamic]', ...args),
      info: (...args: any[]) => opts.logger?.info('[dynamic]', ...args),
    },
    require: createSafeRequire(opts.allowModules),
    Promise,
    setTimeout,
    clearTimeout,
    Date,
    JSON,
    Math,
  });
}

const scriptCache = new Map<string, vm.Script>();
const transpiler = new Bun.Transpiler({ loader: 'ts' });

// Compile and cache agent code
function compileAgent(tsSource: string, agentName: string, timeout: number): { script: vm.Script; hash: string } {
  const hash = computeCodeHash(tsSource);
  
  if (scriptCache.has(hash)) {
    return { script: scriptCache.get(hash)!, hash };
  }
  
  const js = transpiler.transformSync(tsSource);
  const cleanedJs = js
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+/gm, '');
  
  const wrapped = `
    (function() {
      ${cleanedJs}
      if (typeof Agent !== 'function') {
        throw new Error('Dynamic agent must define function Agent(req, resp, ctx)');
      }
      return Agent;
    })();
  `;
  
  const script = new vm.Script(wrapped, {
    filename: `dynamic-${agentName}-${hash.substring(0, 8)}.js`,
  });
  
  scriptCache.set(hash, script);
  return { script, hash };
}

export default async function DynamicExecutor(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    // Parse input
    const input = await req.data.json();
    
    if (!input.code) {
      return resp.json({
        error: 'Missing required field: code',
        usage: {
          code: 'async function Agent(req, resp, ctx) { ... }',
          data: 'input data for the dynamic agent (optional)',
          agentName: 'name for the dynamic agent (optional, default: "dynamic")',
          timeout: 'execution timeout in ms (optional, default: 200)',
          maxKVOps: 'max KV operations (optional, default: 100)',
          maxVectorOps: 'max Vector operations (optional, default: 50)',
        },
      });
    }
    
    const {
      code,
      data = '',
      agentName = 'dynamic',
      timeout = 200,
      maxKVOps = 100,
      maxVectorOps = 50,
    } = input;
    
    ctx.logger.info('Executing dynamic agent:', { agentName, codeLength: code.length });
    
    // Compile the agent code
    const { script, hash } = compileAgent(code, agentName, timeout);
    
    // Create sandbox
    const sandbox = createSandbox({
      allowModules: {},
      logger: ctx.logger,
    });
    
    // Execute script to get the agent function
    const agentFn = script.runInNewContext(sandbox, { timeout });
    
    // Create mock request with provided data
    const mockReq: AgentRequest = {
      data: {
        text: async () => typeof data === 'string' ? data : JSON.stringify(data),
        json: async () => typeof data === 'object' ? data : JSON.parse(data),
      },
      metadata: (key?: string) => req.metadata(key),
      trigger: 'dynamic',
    } as AgentRequest;
    
    // Harden the context
    const hardenedCtx = hardenContext(ctx, {
      agentName,
      codeHash: hash,
      maxKVOps,
      maxVectorOps,
    });
    
    // Execute the dynamic agent
    const result = await agentFn(mockReq, resp, hardenedCtx);
    
    ctx.logger.info('Dynamic agent executed successfully', {
      agentName,
      codeHash: hash.substring(0, 8),
    });
    
    return result;
    
  } catch (error: any) {
    ctx.logger.error('Dynamic agent execution failed:', {
      error: error.message,
      stack: error.stack,
    });
    
    return resp.json({
      error: 'Dynamic agent execution failed',
      message: error.message,
      details: error.stack,
    });
  }
}
