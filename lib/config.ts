/**
 * Application configuration
 * Contains non-secret configuration values
 */

const DEFAULT_AGENT_BASE_URL = 'https://p0f83a312791b60ff.agentuity.run';

export const config = {
    kvStoreName: 'docs-sandbox-chat-sessions',
    // V1 Agent endpoints - defaults to production doc-agents URL
    agentBaseUrl: process.env.AGENT_BASE_URL || DEFAULT_AGENT_BASE_URL,
    agentuityRegion: 'use',
} as const;
