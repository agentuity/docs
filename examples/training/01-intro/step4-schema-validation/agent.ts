import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    // Schema handles validation automatically!
    input: z.object({
      name: z.string().min(1, 'Name cannot be empty').optional()
    }),
    output: z.object({
      message: z.string(),
      greetingNumber: z.number(),
      timestamp: z.string()
    })
  },
  metadata: {
    name: 'Hello Agent',
    description: 'Greeting agent with schema validation'
  },
  handler: async (c, input) => {
    // No manual validation needed - schema rejects invalid input before handler runs!

    c.logger.info('Hello agent received a request');

    const name = input.name || 'World';

    // Still handle storage errors gracefully
    let count = 1;
    try {
      const counterResult = await c.kv.get('stats', 'greeting_count');
      if (counterResult.exists) {
        count = await counterResult.data.json();
        count++;
      }
      await c.kv.set('stats', 'greeting_count', count);
    } catch (error) {
      c.logger.error('Storage error, using default count', { error });
    }

    c.logger.info(`Greeting #${count} for ${name}`);

    return {
      message: `Hello, ${name}!`,
      greetingNumber: count,
      timestamp: new Date().toISOString()
    };
  }
});
