import { createMiddleware } from 'hono/factory';

/**
 * Bearer token authentication middleware
 * Validates the Authorization header contains the correct bearer token
 */
export const bearerTokenAuth = createMiddleware(async (c, next) => {
	const authHeader = c.req.header('Authorization');
	const expectedToken = process.env.AGENT_BEARER_TOKEN;

	// Check if Authorization header exists
	if (!authHeader) {
		c.var.logger.warn('Missing Authorization header');
		return c.json({ error: 'Missing Authorization header' }, 401);
	}

	// Check if it starts with Bearer
	if (!authHeader.startsWith('Bearer ')) {
		c.var.logger.warn('Invalid Authorization header format');
		return c.json({ error: 'Invalid Authorization header format' }, 401);
	}

	const token = authHeader.slice(7);

	// Validate token matches expected value
	if (!expectedToken || token !== expectedToken) {
		c.var.logger.warn('Invalid bearer token');
		return c.json({ error: 'Invalid bearer token' }, 401);
	}

	// Token is valid, proceed to next handler
	await next();
});
