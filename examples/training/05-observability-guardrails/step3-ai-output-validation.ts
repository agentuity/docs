import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

// Define schema for AI-generated sentiment analysis
const SentimentAnalysisSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  summary: z.string()
});

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Get user query
  const data = await request.data.json();
  const userQuery = data.query || 'This is a great product!';

  context.logger.info('Generating AI analysis', { queryLength: userQuery.length });

  try {
    // AI generates validated structured output
    const analysis = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: SentimentAnalysisSchema,
      prompt: `Analyze the sentiment of this text: "${userQuery}"

      Provide:
      - sentiment: positive, negative, or neutral
      - confidence: a number between 0 and 1
      - summary: a brief explanation (1-2 sentences)`
    });

    // analysis.object is guaranteed to match schema
    context.logger.info('Analysis complete', {
      sentiment: analysis.object.sentiment,
      confidence: analysis.object.confidence
    });

    return response.json({
      query: userQuery,
      analysis: analysis.object,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    context.logger.error('AI generation failed', error);
    return response.json({
      error: 'Failed to generate analysis'
    }, { status: 500 });
  }
}
