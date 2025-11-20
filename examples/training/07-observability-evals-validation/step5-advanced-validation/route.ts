import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// User registration endpoint
router.post('/register', async (c) => {
  const body = await c.req.json();

  // Call registration agent (validation happens automatically)
  const result = await c.agent.userRegistration.run(body);

  return c.json(result);
});
