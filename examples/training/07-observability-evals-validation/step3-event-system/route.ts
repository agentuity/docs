import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Process query endpoint
router.post('/process', async (c) => {
  const body = await c.req.json();

  // Call data processor (events fire automatically)
  const result = await c.agent.dataProcessor.run(body);

  return c.json(result);
});
