import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Routes handle HTTP concerns: parsing, calling agent, formatting response
router.post('/tasks', async (c) => {
  const body = await c.req.json();

  // Call agent with type-safe access
  const result = await c.agent.taskAgent.run(body);

  return c.json(result);
});
