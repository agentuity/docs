import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// Define schema for AI-generated sentiment analysis
const SentimentAnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  summary: z.string()
});

export default createAgent('sentiment-analyzer', {
  handler: async (ctx, input) => {
    const data = input as { query?: string };
    const userQuery = data.query || 'This is a great product!';

    ctx.logger.info('Generating AI analysis', { queryLength: userQuery.length });

    // AI generates validated structured output
    const analysis = await generateObject({
      model: openai('gpt-5-mini'),
      schema: SentimentAnalysisSchema,
      prompt: `Analyze the sentiment of this text: "${userQuery}"

      Provide:
      - sentiment: positive, negative, or neutral
      - confidence: a number between 0 and 1
      - summary: a brief explanation (1-2 sentences)`
    });

    // analysis.object is guaranteed to match schema
    ctx.logger.info('Analysis complete', {
      sentiment: analysis.object.sentiment,
      confidence: analysis.object.confidence
    });

    return {
      query: userQuery,
      analysis: analysis.object,
      generatedAt: new Date().toISOString()
    };
  }
});
