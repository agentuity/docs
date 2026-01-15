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
      conversationDuration: z.number()
    })
  },
  metadata: {
    name: 'State Lifecycle Agent',
    description: 'Demonstrates thread lifecycle, cleanup, and event handling'
  },
  handler: async (c, input) => {
    // Register cleanup handler once per thread
    if (!c.thread.state.has('cleanupRegistered')) {
      c.thread.addEventListener('destroyed', async (eventName, thread) => {
        const messages = thread.state.get('messages') as string[] || [];
        const startTime = thread.state.get('startTime') as number || Date.now();
        const duration = Date.now() - startTime;

        c.logger.info('Thread destroyed - cleanup executing', {
          threadId: thread.id,
          messageCount: messages.length,
          conversationDuration: duration,
          reason: 'Expiration or manual destroy'
        });

        // In a real app, you might save conversation summary to KV storage here
        // await c.kv.set('conversation-summaries', thread.id, { ... });

        // Clear thread state
        thread.state.clear();
      });

      c.thread.state.set('cleanupRegistered', true);
      c.thread.state.set('startTime', Date.now());

      c.logger.info('Thread lifecycle tracking initialized', {
        threadId: c.thread.id
      });
    }

    // Track messages in thread state
    const messages = (c.thread.state.get('messages') as string[]) || [];
    messages.push(input.message);
    c.thread.state.set('messages', messages);

    const startTime = c.thread.state.get('startTime') as number;
    const conversationDuration = Date.now() - startTime;

    return {
      response: `Message ${messages.length} stored. Thread expires in 1 hour.`,
      messageCount: messages.length,
      threadId: c.thread.id,
      conversationDuration
    };
  }
});

export default agent;
