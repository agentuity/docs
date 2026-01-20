/**
 * Application configuration
 * Contains non-secret configuration values
 */

export const config = {
    kvStoreName: 'docs-sandbox-chat-sessions',
    // V1 Agent endpoints - use base URL + specific endpoint paths
    agentBaseUrl: process.env.AGENT_BASE_URL || 'http://127.0.0.1:3500',
} as const;
