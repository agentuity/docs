/**
 * Environment variable validation and configuration utility
 */
export interface AgentConfig {
  url: string;
  bearerToken?: string;
}

import { config } from '@/lib/config';

const buildAgentConfig = (endpoint: string): AgentConfig => {
  const baseUrl = config.agentBaseUrl;
  const bearerToken = process.env.AGENT_BEARER_TOKEN;

  if (!baseUrl) {
    throw new Error(
      'Missing required configuration. Set AGENT_BASE_URL or ensure config.agentBaseUrl is defined.'
    );
  }
  if (!endpoint) {
    throw new Error('Missing required agent endpoint');
  }

  return {
    url: `${baseUrl}${endpoint}`,
    bearerToken: bearerToken || undefined,
  };
};

export const getAgentQaConfig = (): AgentConfig => {
  return buildAgentConfig('/api/doc-qa');
};

export const getAgentPulseConfig = (): AgentConfig => {
  return buildAgentConfig('/api/agent-pulse');
};

/**
 * Validates environment variables at startup
 */
export const validateEnv = (): boolean => {
  try {
    getAgentQaConfig();
    console.log('✓ Agent configuration validated');
    return true;
  } catch (error) {
    console.error('❌ Agent configuration validation failed:', error);
    console.error('💡 Set AGENT_BASE_URL env var for agent communication');
    console.error('   Default: http://127.0.0.1:3500 (for local development)');
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
