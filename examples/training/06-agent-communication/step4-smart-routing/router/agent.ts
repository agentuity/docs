import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

// Define structured schema for routing decisions
const RoutingDecisionSchema = z.object({
  agentType: z.enum(['support', 'sales']),
  tags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
});

export const agent = createAgent({
  schema: {
    input: z.object({
      message: z.string()
    }),
    output: z.object({
      routed: z.boolean(),
      agentType: z.string().optional(),
      response: z.string(),
      confidence: z.number().optional(),
      reasoning: z.string().optional()
    })
  },
  metadata: {
    name: 'Smart Router',
    description: 'AI-powered request routing with structured decisions'
  },
  handler: async (c, input) => {
    c.logger.info('Analyzing request for routing', { message: input.message });

    // Uses an LLM with structured output to determine routing
    const { object: decision } = await generateObject({
      model: anthropic('claude-sonnet-4-5'),
      schema: RoutingDecisionSchema,
      system: `You are a routing orchestrator. Analyze user messages and determine which
specialist agent should handle them. Consider the user's intent and return a structured
routing decision.

Agent types:
- support: Customer support, account issues, general help, troubleshooting
- sales: Pricing, plans, purchasing inquiries, product demos`,
      prompt: `Analyze this user message and determine routing: "${input.message}"`
    });

    c.logger.info('Routing decision made', {
      agentType: decision.agentType,
      confidence: decision.confidence
    });

    // Check confidence threshold - fallback if too low
    if (decision.confidence < 0.7) {
      c.logger.warn('Low confidence routing', { confidence: decision.confidence });
      return {
        routed: false,
        response: "I'm not confident about routing this request. Please rephrase or contact support directly.",
        confidence: decision.confidence,
        reasoning: decision.reasoning
      };
    }

    // Route to appropriate specialist agent based on validated decision
    const targetAgent = `${decision.agentType}Agent`;
    c.logger.info('Routing to specialist', { targetAgent });

    const result = await c.agent[targetAgent].run({
      message: input.message,
      context: {
        tags: decision.tags,
        confidence: decision.confidence
      }
    });

    return {
      routed: true,
      agentType: decision.agentType,
      response: result.response,
      confidence: decision.confidence,
      reasoning: decision.reasoning
    };
  }
});
