import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent('hello-agent', {
  // Schemas validate input/output (we'll explore these in Module 6)
  schema: {
    input: z.object({
      name: z.string().optional() // string, but not required
    }),
    output: z.object({
      message: z.string()
    })
  },

  // Metadata helps identify your agent
  metadata: {
    description: 'Simple greeting agent for learning v1 basics'
  },

  // Handler receives (ctx, input) - input is already parsed and validated!
  handler: async (ctx, input) => {
    const name = input.name || 'World';

    // Return data directly - no response.json() needed
    return {
      message: `Hello, ${name}!`
    };
  }
});
