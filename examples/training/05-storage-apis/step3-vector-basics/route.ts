import { createRouter } from '@agentuity/runtime';

const router = createRouter();

// POST endpoint for semantic search
router.post('/search', async (c) => {
  const data = await c.req.json();

  const result = await c.agent.vectorBasicsAgent.run({
    query: data.query
  });

  return c.json(result);
});

export default router;
