import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      action: z.enum(['create', 'get']),
      task: z.string().optional()
    }),
    output: z.object({
      success: z.boolean(),
      message: z.string()
    })
  },
  metadata: {
    name: 'Task Agent',
    description: 'Simple task management'
  },
  // Handler contains business logic only
  handler: async (c, input) => {
    c.logger.info('Task action', { action: input.action });

    if (input.action === 'create') {
      return {
        success: true,
        message: `Created: ${input.task}`
      };
    }

    return {
      success: true,
      message: 'Task retrieved'
    };
  }
});
