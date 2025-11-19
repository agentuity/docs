import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      recipient: z.string(),
      message: z.string()
    }),
    output: z.object({
      sent: z.boolean(),
      id: z.string()
    })
  },
  metadata: {
    name: 'Notification Agent',
    description: 'Send notifications'
  },
  handler: async (c, input) => {
    const id = `notif-${Date.now()}`;

    c.logger.info('Sending notification', {
      recipient: input.recipient,
      id
    });

    // Store notification
    await c.kv.set('notifications', id, {
      recipient: input.recipient,
      message: input.message,
      sentAt: new Date().toISOString()
    }, { ttl: 86400 }); // 24 hours

    return { sent: true, id };
  }
});
