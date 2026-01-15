import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const agent = createAgent({
  schema: {
    input: z.object({
      message: z.string(),
      context: z.object({
        tags: z.array(z.string()),
        confidence: z.number()
      }).optional()
    }),
    output: z.object({
      response: z.string(),
      ticketCreated: z.boolean(),
      severity: z.enum(['low', 'medium', 'high', 'urgent']),
      suggestedActions: z.array(z.string())
    })
  },
  metadata: {
    name: 'Support Agent',
    description: 'Handles customer support requests with AI-powered response generation'
  },
  handler: async (c, input) => {
    c.logger.info('Support agent processing request', {
      message: input.message,
      tags: input.context?.tags
    });

    // Use AI to generate contextual response and assess severity
    const { object: analysis } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: z.object({
        response: z.string(),
        severity: z.enum(['low', 'medium', 'high', 'urgent']),
        suggestedActions: z.array(z.string())
      }),
      system: `You are a customer support specialist. Analyze support requests and provide
helpful responses with severity assessment and suggested actions.`,
      prompt: `Customer request: "${input.message}"
Context tags: ${input.context?.tags.join(', ') || 'none'}

Provide a professional support response, assess severity, and suggest 2-3 actions.`
    });

    // Store support interaction for analytics (similar to v0 pattern)
    await c.kv.set('support-tickets', c.sessionId, {
      message: input.message,
      severity: analysis.severity,
      timestamp: new Date().toISOString()
    });

    c.logger.info('Support ticket created', {
      severity: analysis.severity,
      actionCount: analysis.suggestedActions.length
    });

    return {
      response: analysis.response,
      ticketCreated: true,
      severity: analysis.severity,
      suggestedActions: analysis.suggestedActions
    };
  }
});
