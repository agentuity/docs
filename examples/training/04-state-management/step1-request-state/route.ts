import { createRouter } from '@agentuity/runtime';

const router = createRouter();

// POST endpoint to process tasks with timing metrics
router.post('/process', async (c) => {
  const data = await c.req.json();

  // Call the agent
  const result = await c.agent.requestStateAgent.run(data);

  return c.json(result);
});

// GET endpoint to demonstrate request state isolation
router.get('/status', async (c) => {
  const result = await c.agent.requestStateAgent.run({
    task: 'status-check',
    simulateDelay: false
  });

  return c.json({
    status: 'healthy',
    ...result
  });
});

export default router;
