import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Intelligent routing endpoint
router.post('/route', async (c) => {
  const body = await c.req.json();

  // Call smart router which uses AI to determine the right agent
  const result = await c.agent.smartRouter.run(body);

  return c.json(result);
});
