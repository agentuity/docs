import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent('hello-agent', {
  schema: {
    input: z.object({ name: z.string().optional() }),
    output: z.object({
      message: z.string(),
      greetingNumber: z.number(),
      timestamp: z.string()
    })
  },
  metadata: {
    description: 'Greeting agent with memory'
  },
  handler: async (ctx, input) => {
    ctx.logger.info('Hello agent received a request');

    const name = input.name || 'World';

    // Get current greeting count from KV storage
    const counterResult = await ctx.kv.get('stats', 'greeting_count');

    let count: number;
    if (counterResult.exists) {
      // Counter exists - increment it
      count = await counterResult.data.json();
      count++;
    } else {
      // First time - start at 1
      count = 1;
    }

    // Update the counter in storage
    await ctx.kv.set('stats', 'greeting_count', count);

    ctx.logger.info(`Greeting #${count} for ${name}`);

    return {
      message: `Hello, ${name}!`,
      greetingNumber: count,
      timestamp: new Date().toISOString()
    };
  }
});
