import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Pipeline endpoint that processes documents through multiple stages
router.post('/pipeline', async (c) => {
  const body = await c.req.json();

  // Call coordinator which orchestrates the sequential workflow
  const result = await c.agent.pipelineCoordinator.run(body);

  return c.json(result);
});
