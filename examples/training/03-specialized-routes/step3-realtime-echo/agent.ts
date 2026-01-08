import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      message: z.string()
    }),
    output: z.object({
      echo: z.string(),
      timestamp: z.string()
    })
  },
  metadata: {
    name: 'Echo Agent',
    description: 'Echo messages back'
  },
  handler: async (c, input) => {
    return {
      echo: input.message,
      timestamp: new Date().toISOString()
    };
  }
});
