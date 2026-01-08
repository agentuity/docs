import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Data processing endpoint
router.post('/process', async (c) => {
  const body = await c.req.json();

  // Call data processor (child loggers used internally)
  const result = await c.agent.dataProcessor.run(body);

  return c.json(result);
});
