import { createRouter } from '@agentuity/runtime';

const router = createRouter();

// POST endpoint for filtered semantic search
router.post('/products/search', async (c) => {
  const data = await c.req.json();

  const result = await c.agent.vectorFilteringAgent.run({
    query: data.query,
    category: data.category,
    inStock: data.inStock
  });

  return c.json(result);
});

export default router;
