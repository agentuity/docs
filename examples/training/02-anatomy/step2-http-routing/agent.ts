import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      action: z.enum(['list', 'get', 'create', 'update', 'delete']),
      id: z.string().optional(),
      title: z.string().optional(),
      status: z.enum(['pending', 'completed']).optional(),
      filter: z.string().optional()
    }),
    output: z.object({
      success: z.boolean(),
      message: z.string().optional(),
      task: z.any().optional(),
      tasks: z.array(z.any()).optional()
    })
  },
  metadata: {
    name: 'Task Agent',
    description: 'Complete task management with CRUD operations'
  },
  handler: async (c, input) => {
    c.logger.info('Task action', { action: input.action, id: input.id });

    // One agent handles all CRUD operations
    switch (input.action) {
      case 'list':
        c.logger.info('Listing tasks', { filter: input.filter });
        return {
          success: true,
          tasks: [
            { id: '1', title: 'Task 1', status: 'pending' },
            { id: '2', title: 'Task 2', status: 'completed' }
          ].filter(task => !input.filter || task.status === input.filter)
        };

      case 'get':
        c.logger.info('Getting task', { id: input.id });
        return {
          success: true,
          task: { id: input.id, title: 'Example Task', status: 'pending' }
        };

      case 'create':
        c.logger.info('Creating task', { title: input.title });
        return {
          success: true,
          message: `Created task: ${input.title}`,
          task: { id: '123', title: input.title, status: input.status || 'pending' }
        };

      case 'update':
        c.logger.info('Updating task', { id: input.id, title: input.title });
        return {
          success: true,
          message: `Updated task ${input.id}`,
          task: { id: input.id, title: input.title, status: input.status }
        };

      case 'delete':
        c.logger.info('Deleting task', { id: input.id });
        return {
          success: true,
          message: `Deleted task ${input.id}`
        };

      default:
        return {
          success: false,
          message: 'Unknown action'
        };
    }
  }
});
