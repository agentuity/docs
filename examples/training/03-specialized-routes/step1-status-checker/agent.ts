import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      service: z.string().optional()
    }),
    output: z.object({
      service: z.string(),
      status: z.string(),
      lastCheck: z.string()
    })
  },
  metadata: {
    name: 'Status Checker',
    description: 'Check service status'
  },
  handler: async (c, input) => {
    const service = input.service || 'api';

    // Get status from KV (updated by cron)
    const cached = await c.kv.get('status', service);

    if (cached.exists) {
      return await cached.data.json();
    }

    // Default status if not in cache
    return {
      service,
      status: 'up',
      lastCheck: new Date().toISOString()
    };
  }
});
