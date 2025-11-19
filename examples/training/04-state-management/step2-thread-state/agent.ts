import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

const agent = createAgent({
  schema: {
    input: z.object({
      message: z.string()
    }),
    output: z.object({
      response: z.string(),
      messageCount: z.number(),
      threadId: z.string(),
      conversationHistory: z.array(z.string())
    })
  },
  metadata: {
    name: 'Thread State Agent',
    description: 'Demonstrates conversation context with thread state'
  },
  handler: async (c, input) => {
    // THREAD STATE: Get or initialize conversation history
    // Thread state persists across requests for up to 1 hour
    const messages = (c.thread.state.get('messages') as string[]) || [];

    // Add new message to conversation
    messages.push(input.message);

    // Save updated conversation in thread state
    c.thread.state.set('messages', messages);

    // Track when this thread started
    if (!c.thread.state.has('threadStartTime')) {
      c.thread.state.set('threadStartTime', Date.now());
    }

    const startTime = c.thread.state.get('threadStartTime') as number;
    const conversationDuration = Date.now() - startTime;

    c.logger.info('Message added to thread', {
      threadId: c.thread.id,
      messageCount: messages.length,
      conversationDuration
    });

    return {
      response: `Message ${messages.length} received`,
      messageCount: messages.length,
      threadId: c.thread.id,
      conversationHistory: messages
    };

    // THREAD STATE persists for up to 1 hour across requests
  }
});

export default agent;
