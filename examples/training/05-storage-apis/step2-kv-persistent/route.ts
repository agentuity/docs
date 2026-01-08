import { createRouter } from '@agentuity/runtime';

const router = createRouter();

// GET user preferences
router.get('/users/:userId/settings', async (c) => {
  const userId = c.req.param('userId');

  const result = await c.agent.kvPersistentAgent.run({
    userId
  });

  return c.json(result);
});

// POST to update user preferences
router.post('/users/:userId/settings', async (c) => {
  const userId = c.req.param('userId');
  const updatePreferences = await c.req.json();

  const result = await c.agent.kvPersistentAgent.run({
    userId,
    updatePreferences
  });

  return c.json(result);
});

export default router;
