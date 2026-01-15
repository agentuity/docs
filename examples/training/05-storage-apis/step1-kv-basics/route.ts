import { createRouter } from '@agentuity/runtime';

const router = createRouter();

// POST endpoint for cached queries
router.post('/query', async (c) => {
  const data = await c.req.json();

  const result = await c.agent.kvBasicsAgent.run({
    query: data.query
  });

  return c.json(result);
});

// DELETE endpoint to clear cache for testing
router.delete('/cache/:key', async (c) => {
  const key = c.req.param('key');
  const bucket = 'api-cache';

  await c.kv.delete(bucket, key);

  return c.json({
    message: `Cache cleared for key: ${key}`
  });
});

export default router;
