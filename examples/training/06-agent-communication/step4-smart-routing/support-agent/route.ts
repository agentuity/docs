import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Direct support endpoint (bypasses routing)
router.post('/support', async (c) => {
  const body = await c.req.json();
  const result = await c.agent.supportAgent.run(body);
  return c.json(result);
});
