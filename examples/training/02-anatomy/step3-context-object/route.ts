import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

router.get('/users/:userId/tasks', async (c) => {
  // Extract route parameter and query string
  const userId = c.req.param('userId');
  const filter = c.req.query('filter');

  // Child logger adds userId to all subsequent logs
  const userLogger = c.logger.child({ userId });
  userLogger.info('Fetching tasks', { filter });

  // Check KV cache with composite key
  const cacheKey = `tasks:${userId}:${filter || 'all'}`;
  const cached = await c.kv.get('cache', cacheKey);

  if (cached.exists) {
    userLogger.info('Cache hit');
    return c.json(await cached.data.json());
  }

  userLogger.info('Cache miss - calling agent');

  // Call agent with validated input
  const result = await c.agent.taskAgent.run({
    action: 'list',
    userId,
    filter
  });

  // Cache result for 5 minutes (300 seconds)
  await c.kv.set('cache', cacheKey, result, { ttl: 300 });

  userLogger.info('Tasks delivered and cached');

  return c.json(result);
});
