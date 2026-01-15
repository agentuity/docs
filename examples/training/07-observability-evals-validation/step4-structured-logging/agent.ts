import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      data: z.array(z.string()),
      userId: z.string()
    }),
    output: z.object({
      processed: z.number(),
      validated: z.number()
    })
  },
  metadata: {
    name: 'Data Processor',
    description: 'Processes data with component-based logging'
  },
  handler: async (c, input) => {
    // Create child loggers for different components
    const validationLogger = c.logger.child({ component: 'validation' });
    const processingLogger = c.logger.child({ component: 'processing' });

    // Validation phase
    validationLogger.info('Starting validation', {
      itemCount: input.data.length,
      userId: input.userId
    });

    const valid = input.data.filter(item => item.length > 0);

    if (valid.length < input.data.length) {
      validationLogger.warn('Invalid items found', {
        total: input.data.length,
        valid: valid.length,
        invalid: input.data.length - valid.length
      });
    } else {
      validationLogger.debug('All items valid');
    }

    // Processing phase
    processingLogger.info('Starting processing', {
      itemCount: valid.length
    });

    const processed = valid.map(item => item.toUpperCase());

    processingLogger.info('Processing complete', {
      processedCount: processed.length
    });

    return {
      processed: processed.length,
      validated: valid.length
    };
  }
});
