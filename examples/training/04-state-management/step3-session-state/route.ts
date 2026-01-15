import { createRouter } from '@agentuity/runtime';

const router = createRouter();

// GET user preferences
router.get('/users/:userId/preferences', async (c) => {
  const userId = c.req.param('userId');

  const result = await c.agent.sessionStateAgent.run({
    userId
  });

  return c.json(result);
});

// POST to update user preferences
router.post('/users/:userId/preferences', async (c) => {
  const userId = c.req.param('userId');
  const updatePreferences = await c.req.json();

  const result = await c.agent.sessionStateAgent.run({
    userId,
    updatePreferences
  });

  return c.json(result);
});

// DELETE to reset user preferences (for testing)
router.delete('/users/:userId/preferences', async (c) => {
  const userId = c.req.param('userId');

  // Clear session state for this user
  c.session.state.delete(`preferences_${userId}`);
  c.session.state.delete(`updateCount_${userId}`);

  return c.json({
    message: `Preferences cleared for user ${userId}`
  });
});

export default router;
