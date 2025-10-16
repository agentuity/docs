import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { z } from "zod";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// Define schema for routing decisions
const RoutingDecisionSchema = z.object({
  agentType: z.enum(['support', 'sales', 'technical']),
  tags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
});

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const userMessage = await request.data.text();

  context.logger.info('Analyzing request for routing');

  // Use AI with structured output to determine routing
  const { object: decision } = await generateObject({
    model: anthropic('claude-3-5-sonnet-20241022'),
    schema: RoutingDecisionSchema,
    system: `You are a routing orchestrator. Analyze user messages and determine which
specialist agent should handle them. Consider the user's intent and return a structured
routing decision.`,
    prompt: `Analyze this user message and determine routing: "${userMessage}"`
  });

  context.logger.info(
    `Routing decision: ${decision.agentType} (confidence: ${decision.confidence})`
  );

  // Only route if confidence is high enough
  if (decision.confidence < 0.7) {
    return response.json({
      message: "I'm not confident about routing this. Let me connect you with a human.",
      reasoning: decision.reasoning,
      tags: decision.tags
    });
  }

  // Route to appropriate agent based on validated decision
  const targetAgent = await context.getAgent({ name: `${decision.agentType}-agent` });
  const result = await targetAgent.run({
    data: userMessage,
    contentType: "text/plain"
  });

  return response.text(await result.data.text());
}
