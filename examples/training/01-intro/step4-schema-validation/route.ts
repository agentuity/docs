import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

router.post('/greet', async (c) => {
  const body = await c.req.json();
  const result = await c.agent.helloAgent.run(body);
  return c.json(result);
});
