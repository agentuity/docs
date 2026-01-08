import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Define an HTTP POST endpoint at /greet
router.post('/greet', async (c) => {
  // Get request body
  const body = await c.req.json();

  // Call the agent (type-safe)
  const result = await c.agent.helloAgent.run(body);

  // Return the result
  return c.json(result);
});
