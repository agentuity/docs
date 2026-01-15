import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Data pipeline endpoint
router.post('/pipeline', async (c) => {
  const body = await c.req.json();

  // Call data pipeline (custom spans track execution)
  const result = await c.agent.dataPipeline.run(body);

  return c.json(result);
});
