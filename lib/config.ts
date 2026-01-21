/**
 * Application configuration
 * Contains non-secret configuration values
 */

export const config = {
    kvStoreName: 'docs-sandbox-chat-sessions',
    // V1 Agent endpoints - must be set via AGENT_BASE_URL env var
    agentBaseUrl: process.env.AGENT_BASE_URL,
    agentuityRegion: 'use',
} as const;
