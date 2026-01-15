import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// Schema for sentiment analysis output
const SentimentSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  summary: z.string()
});

export const agent = createAgent({
  schema: {
    input: z.object({
      text: z.string()
    }),
    output: SentimentSchema
  },
  metadata: {
    name: 'Sentiment Analyzer',
    description: 'Analyzes sentiment with confidence scoring'
  },
  handler: async (c, input) => {
    c.logger.info('Analyzing sentiment', { textLength: input.text.length });

    // Generate sentiment analysis with AI
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: SentimentSchema,
      prompt: `Analyze the sentiment of this text: "${input.text}"

      Provide:
      - sentiment: positive, negative, or neutral
      - confidence: a number between 0 and 1
      - summary: a brief explanation (1-2 sentences)`
    });

    c.logger.info('Sentiment analysis complete', {
      sentiment: object.sentiment,
      confidence: object.confidence
    });

    return object;
  }
});

// Basic binary pass/fail evaluation
agent.createEval({
  metadata: {
    name: 'confidence-threshold',
    description: 'Ensures minimum confidence level for reliable results'
  },
  handler: async (c, input, output) => {
    const threshold = 0.7;
    const passed = output.confidence >= threshold;

    c.logger.info('Confidence evaluation', {
      confidence: output.confidence,
      threshold,
      passed
    });

    return {
      success: true,
      passed,
      metadata: {
        confidence: output.confidence,
        threshold,
        sentiment: output.sentiment
      }
    };
  }
});
