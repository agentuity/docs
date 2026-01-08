import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      from: z.string(),
      subject: z.string(),
      message: z.string()
    }),
    output: z.object({
      response: z.string()
    })
  },
  metadata: {
    name: 'Email Responder',
    description: 'Respond to emails'
  },
  handler: async (c, input) => {
    c.logger.info('Processing email', {
      from: input.from,
      subject: input.subject
    });

    // Process the email (simple acknowledgment for now)
    return {
      response: 'Thank you for your email!'
    };
  }
});
