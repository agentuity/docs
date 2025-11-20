import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const agent = createAgent({
  schema: {
    input: z.object({
      text: z.string()
    }),
    output: z.object({
      text: z.string(),
      sentiment: z.enum(['positive', 'negative', 'neutral']),
      confidence: z.number(),
      processedAt: z.string()
    })
  },
  metadata: {
    name: 'Enricher',
    description: 'Enriches text with AI-powered sentiment analysis'
  },
  handler: async (c, input) => {
    c.logger.info('Enricher analyzing text sentiment', { length: input.text.length });

    // Use AI to analyze sentiment
    const { object: analysis } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: z.object({
        sentiment: z.enum(['positive', 'negative', 'neutral']),
        confidence: z.number().min(0).max(1)
      }),
      prompt: `Analyze the sentiment of this text and provide a confidence score: "${input.text}"`
    });

    c.logger.info('Sentiment analysis complete', {
      sentiment: analysis.sentiment,
      confidence: analysis.confidence
    });

    return {
      text: input.text,
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
      processedAt: new Date().toISOString()
    };
  }
});
