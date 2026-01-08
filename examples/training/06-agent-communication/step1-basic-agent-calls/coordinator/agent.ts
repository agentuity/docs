import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      text: z.string()
    }),
    output: z.object({
      original: z.string(),
      enriched: z.object({
        text: z.string(),
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        confidence: z.number(),
        processedAt: z.string()
      })
    })
  },
  metadata: {
    name: 'Coordinator',
    description: 'Coordinates with enricher agent and tracks history'
  },
  handler: async (c, input) => {
    c.logger.info('Coordinator processing request', { text: input.text });

    // Store request (in KV storage) for analytics
    await c.kv.set('enrichment-history', c.sessionId, {
      text: input.text,
      timestamp: new Date().toISOString()
    });

    // Call enricher agent with type-safe access
    const enriched = await c.agent.enricher.run({
      text: input.text
    });

    c.logger.info('Received enriched data', {
      sentiment: enriched.sentiment,
      confidence: enriched.confidence
    });

    // Return combined results
    return {
      original: input.text,
      enriched
    };
  }
});
