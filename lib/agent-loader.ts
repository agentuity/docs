import { canLoadAgentCode } from './env-detection';

/**
 * Conditionally load agent-docs code only in Node.js environments
 * This prevents OpenTelemetry auto-instrumentations from loading in Cloudflare Workers
 */
export async function loadAgentCode() {
  if (!canLoadAgentCode()) {
    throw new Error('Agent code cannot be loaded in this environment');
  }
  
  try {
    const agentModule = await import('../agent-docs/src/agents/agent-pulse/index');
    return agentModule.default;
  } catch (error) {
    const stubModule = await import('./agent-stub');
    return stubModule.default;
  }
}

/**
 * Check if agent code can be loaded in the current environment
 */
export function isAgentCodeAvailable(): boolean {
  return canLoadAgentCode();
}
