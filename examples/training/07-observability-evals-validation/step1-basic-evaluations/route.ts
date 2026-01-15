import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Analyze sentiment endpoint
router.post('/analyze', async (c) => {
  const body = await c.req.json();

  // Call sentiment analyzer agent (eval runs automatically after)
  const result = await c.agent.sentimentAnalyzer.run(body);

  return c.json(result);
});
