import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Process endpoint that runs translation and summarization in parallel
router.post('/process', async (c) => {
  const body = await c.req.json();

  // Call processor which runs translation and summarization in parallel
  const result = await c.agent.contentProcessor.run(body);

  return c.json(result);
});
