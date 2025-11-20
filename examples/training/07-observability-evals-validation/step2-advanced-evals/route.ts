import { createRouter } from '@agentuity/runtime';

export const router = createRouter();

// Content moderation endpoint
router.post('/moderate', async (c) => {
  const body = await c.req.json();

  // Call content moderator (safety eval runs automatically after)
  const result = await c.agent.contentModerator.run(body);

  return c.json(result);
});
