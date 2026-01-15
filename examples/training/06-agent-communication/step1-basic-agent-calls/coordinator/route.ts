import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Simple POST endpoint that calls the coordinator agent
router.post('/process', async (c) => {
  const body = await c.req.json();

  // Call coordinator agent (which calls enricher internally)
  const result = await c.agent.coordinator.run(body);

  return c.json(result);
});
