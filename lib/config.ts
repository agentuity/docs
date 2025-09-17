/**
 * Application configuration
 * Contains non-secret configuration values
 */

export const config = {
    baseUrl: process.env.AGENTUITY_BASE_URL || 'https://api.agentuity.com',
    defaultStoreName: 'chat-sessions'
} as const;

/**
 * Validates required configuration at startup
 */
export function validateConfig(): void {
    if (!config.baseUrl) {
        throw new Error('Missing required environment variable: AGENTUITY_BASE_URL');
    }
} 