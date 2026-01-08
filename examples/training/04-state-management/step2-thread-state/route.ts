import { createRouter } from '@agentuity/runtime';

const router = createRouter();

// POST endpoint for chat messages
router.post('/chat', async (c) => {
  const data = await c.req.json();

  // Check for reset request
  if (data.reset) {
    // Manually destroy thread to start fresh conversation
    await c.thread.destroy();
    return c.json({
      message: 'Conversation reset. Send a new message to start.',
      threadId: null
    });
  }

  // Call the agent
  const result = await c.agent.threadStateAgent.run({
    message: data.message
  });

  return c.json(result);
});

// GET endpoint to view current conversation state
router.get('/chat/history', async (c) => {
  // Get conversation history from current thread
  const messages = (c.thread.state.get('messages') as string[]) || [];

  return c.json({
    threadId: c.thread.id,
    messageCount: messages.length,
    messages
  });
});

export default router;
