import { createRouter } from '@agentuity/runtime';

const router = createRouter();

// POST endpoint for messages
router.post('/conversation', async (c) => {
  const data = await c.req.json();

  const result = await c.agent.lifecycleAgent.run({
    message: data.message
  });

  return c.json(result);
});

// POST endpoint to manually reset conversation
router.post('/conversation/reset', async (c) => {
  // Manually destroy thread - triggers 'destroyed' event
  await c.thread.destroy();

  return c.json({
    message: 'Conversation reset. Thread destroyed and cleanup executed.',
    info: 'Check logs to see cleanup event handler execution'
  });
});

// GET endpoint to view thread status
router.get('/conversation/status', async (c) => {
  const messages = (c.thread.state.get('messages') as string[]) || [];
  const startTime = c.thread.state.get('startTime') as number;
  const duration = startTime ? Date.now() - startTime : 0;

  return c.json({
    threadId: c.thread.id,
    messageCount: messages.length,
    conversationDuration: duration,
    expiresIn: '1 hour from thread creation'
  });
});

export default router;
