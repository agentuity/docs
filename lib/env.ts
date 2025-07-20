/**
 * Environment variable validation and configuration utility
 */
export interface AgentConfig {
  url: string;
  bearerToken?: string;
}
/**
 * Creates agent configuration from environment variables
 */
const createAgentConfig = (agentIdKey: string): AgentConfig => {
  const baseUrl = process.env.AGENT_BASE_URL;
  const agentId = process.env[agentIdKey];
  const bearerToken = process.env.AGENT_BEARER_TOKEN;

  if (!baseUrl || !agentId) {
    throw new Error(
      `Missing required environment variables. Set both AGENT_BASE_URL and ${agentIdKey}`
    );
  }

  return {
    url: `${baseUrl}/${agentId}`,
    bearerToken: bearerToken || undefined,
  };
};

export const getAgentConfig = (): AgentConfig => {
  return createAgentConfig('AGENT_QA_ID');
};

export const getAgentPulseConfig = (): AgentConfig => {
  return createAgentConfig('AGENT_PULSE_ID');
};

/**
 * Validates environment variables at startup
 */
export const validateEnv = (): boolean => {
  try {
    const config = getAgentConfig();
    console.log('✓ Environment variables validated');
    console.log('✓ Agent URL:', config.url);
    console.log('✓ Bearer token:', config.bearerToken ? 'configured' : 'Not Set');
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    console.error('💡 Make sure to set either:');
    console.error('   - AGENT_FULL_URL, or');
    console.error('   - Both AGENT_BASE_URL and AGENT_ID');
    console.error('💡 Optionally set AGENT_BEARER_TOKEN for authentication');
    return false;
  }
};

/**
 * Environment variable types
 * Use .env.local for development and .env.production for production
 */
declare global {
  interface ProcessEnv {
    AGENT_BASE_URL?: string;
    AGENT_ID?: string;
    AGENT_BEARER_TOKEN?: string;
    AGENT_FULL_URL?: string;
  }
}