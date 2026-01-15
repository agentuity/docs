import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent('hello-agent', {
  schema: {
    input: z.object({ name: z.string().optional() }),
    output: z.object({ message: z.string() })
  },
  metadata: {
    description: 'Greeting agent with logging'
  },
  handler: async (ctx, input) => {
    // Log when agent starts
    ctx.logger.info('Hello agent received a request');

    const name = input.name || 'World';

    // Log the specific action
    ctx.logger.info(`Greeting ${name}`);

    return { message: `Hello, ${name}!` };
  }
});
