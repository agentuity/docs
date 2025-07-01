/**
 * Environment variable validation and configuration utility
 */
export interface AgentConfig {
  url: string;
  bearerToken?: string;
}

/**
 * Validates and returns agent configuration from environment variables
 */
export const getAgentConfig = (): AgentConfig => {
  const baseUrl = process.env.AGENT_BASE_URL;
  const agentId = process.env.AGENT_ID;
  const bearerToken = process.env.AGENT_BEARER_TOKEN;
  const fullUrl = process.env.AGENT_FULL_URL;

  // Validate required environment variables
  if (!fullUrl && (!baseUrl || !agentId)) {
    throw new Error(
      'Missing required environment variables. Either set AGENT_FULL_URL or both AGENT_BASE_URL and AGENT_ID'
    );
  }

  const url = fullUrl || `${baseUrl}/${agentId}`;

  return {
    url,
    bearerToken: bearerToken || undefined,
  };
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
    NEXTJS_ENV?: string;
  }
}