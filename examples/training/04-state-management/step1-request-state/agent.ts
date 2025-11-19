import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

const agent = createAgent({
  schema: {
    input: z.object({
      task: z.string(),
      simulateDelay: z.boolean().optional()
    }),
    output: z.object({
      result: z.string(),
      executionTime: z.number(),
      timestamp: z.string()
    })
  },
  metadata: {
    name: 'Request State Agent',
    description: 'Demonstrates ephemeral request-scoped state'
  },
  handler: async (c, input) => {
    // REQUEST STATE: Set start time for this request only
    c.state.set('requestStart', Date.now());
    c.state.set('taskName', input.task);

    // Simulate some processing
    if (input.simulateDelay) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate execution time using request state
    const startTime = c.state.get('requestStart') as number;
    const executionTime = Date.now() - startTime;

    // Log with request-specific context
    c.logger.info('Task completed', {
      task: input.task,
      executionTime,
      sessionId: c.sessionId
    });

    return {
      result: `Completed: ${input.task}`,
      executionTime,
      timestamp: new Date().toISOString()
    };

    // REQUEST STATE is automatically cleared after this return
  }
});

export default agent;
