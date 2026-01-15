import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      action: z.enum(['list']),
      userId: z.string(),
      filter: z.string().optional()
    }),
    output: z.object({
      success: z.boolean(),
      tasks: z.array(z.any())
    })
  },
  metadata: {
    name: 'Task Agent',
    description: 'Task management with context demonstration'
  },
  handler: async (c, input) => {
    c.logger.info('Listing tasks for user', {
      userId: input.userId,
      filter: input.filter
    });

    // Simulate fetching tasks
    const tasks = [
      { id: '1', title: 'Task 1', status: 'pending' },
      { id: '2', title: 'Task 2', status: 'completed' },
      { id: '3', title: 'Task 3', status: 'pending' }
    ].filter(task => !input.filter || task.status === input.filter);

    return {
      success: true,
      tasks
    };
  }
});
