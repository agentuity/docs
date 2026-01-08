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
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        confidence: z.number(),
        keyPhrases: z.array(z.string())
      }),
      summary: z.object({
        text: z.string(),
        wordCount: z.number()
      })
    })
  },
  metadata: {
    name: 'Pipeline Coordinator',
    description: 'Orchestrates sequential document processing through enrichment and summarization'
  },
  handler: async (c, input) => {
    c.logger.info('Starting sequential pipeline', { text: input.text });

    // Stage 1: Enrich the text with AI-powered analysis
    const enriched = await c.agent.enricher.run({
      text: input.text
    });
    c.logger.info('Enrichment complete', {
      sentiment: enriched.sentiment,
      confidence: enriched.confidence
    });

    // Stage 2: Generate summary using enrichment context
    const summary = await c.agent.summarizer.run({
      text: input.text,
      sentiment: enriched.sentiment,
      keyPhrases: enriched.keyPhrases
    });
    c.logger.info('Summarization complete', { wordCount: summary.wordCount });

    // Return results from both stages
    return {
      original: input.text,
      enriched,
      summary
    };
  }
});
