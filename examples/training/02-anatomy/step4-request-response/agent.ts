import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      action: z.enum(['create', 'get']),
      id: z.string().optional(),
      title: z.string().optional(),
      status: z.enum(['pending', 'completed']).optional()
    }),
    output: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      task: z.any().optional()
    })
  },
  metadata: {
    name: 'Task Agent',
    description: 'Task management with flexible I/O'
  },
  handler: async (c, input) => {
    c.logger.info('Task action', { action: input.action });

    if (input.action === 'create') {
      return {
        success: true,
        message: `Created task: ${input.title}`,
        task: {
          id: '123',
          title: input.title,
          status: input.status || 'pending'
        }
      };
    }

    // Get action
    return {
      success: true,
      task: {
        id: input.id,
        title: 'Example Task',
        status: 'pending'
      }
    };
  }
});
