/**
 * Environment variable validation and configuration utility
 */
export interface AgentConfig {
	url: string;
	bearerToken?: string;
}
/**
 * Builds agent configuration using non-secret IDs from config
 */
import { config } from '@/lib/config';

const buildAgentConfig = (agentId: string): AgentConfig => {
  const baseUrl = process.env.AGENT_BASE_URL;
  const bearerToken = process.env.AGENT_BEARER_TOKEN;

  if (!baseUrl) {
    throw new Error(
      'Missing required configuration. Set AGENT_BASE_URL or ensure config.baseUrl is defined.'
    );
  }
  if (!agentId) {
    throw new Error('Missing required agent ID in config');
  }

  return {
    url: `${baseUrl}/${agentId}`,
    bearerToken: bearerToken || undefined,
  };
};

export const getAgentQaConfig = (): AgentConfig => {
  return buildAgentConfig(config.agentQaId);
};

export const getAgentPulseConfig = (): AgentConfig => {
  return buildAgentConfig(config.agentPulseId);
};

/**
 * Validates environment variables at startup
 */
export const validateEnv = (): boolean => {
  try {
    getAgentQaConfig();
    console.log('✓ Environment variables validated');
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    console.error('💡 Make sure to set base URL via:');
    console.error('   - AGENT_BASE_URL env var, or');
    console.error('   - Use default from config.baseUrl');
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
    AGENT_BEARER_TOKEN?: string;
  }
}
