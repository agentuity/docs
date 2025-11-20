import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Direct access to enricher (optional - mainly called by coordinator)
router.post('/enrich', async (c) => {
  const body = await c.req.json();
  const result = await c.agent.enricher.run(body);
  return c.json(result);
});
