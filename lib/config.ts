/**
 * Application configuration
 * Contains non-secret configuration values
 */

export const config = {
    baseUrl: process.env.AGENTUITY_BASE_URL || 'https://api.agentuity.com',
    defaultStoreName: 'chat-sessions',
    agentQaId: 'agent_9ccc5545e93644bd9d7954e632a55a61',
    agentPulseId: 'agent_ddcb59aa4473f1323be5d9f5fb62b74e'
} as const;

/**
 * Validates required configuration at startup
 */
export function validateConfig(): void {
    if (!config.baseUrl) {
        throw new Error('Missing required environment variable: AGENTUITY_BASE_URL');
    }
} 