import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({ name: z.string().optional() }),
    output: z.object({ message: z.string() })
  },
  metadata: {
    name: 'Hello Agent',
    description: 'Greeting agent with logging'
  },
  handler: async (c, input) => {
    // Log when agent starts
    c.logger.info('Hello agent received a request');

    const name = input.name || 'World';

    // Log the specific action
    c.logger.info(`Greeting ${name}`);

    return { message: `Hello, ${name}!` };
  }
});
