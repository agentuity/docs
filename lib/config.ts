/**
 * Application configuration
 * Contains non-secret configuration values
 */

export const config = {
    baseUrl: 'https://api.agentuity.com',
    defaultStoreName: 'chat-sessions',
    agentBaseUrl: process.env.AGENT_BASE_URL || 'https://agentuity.ai/api',
    agentQaId: '9ccc5545e93644bd9d7954e632a55a61',
    agentPulseId: 'ddcb59aa4473f1323be5d9f5fb62b74e'
} as const;
