import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Get the trigger type
  const trigger = request.trigger;

  context.logger.info(`Agent triggered via: ${trigger}`);

  // Different behavior based on trigger
  if (trigger === 'webhook') {
    return response.json({
      message: 'Received webhook trigger',
      tip: 'Webhooks are great for REST APIs and integrations'
    });
  } else if (trigger === 'manual') {
    return response.json({
      message: 'Manual trigger from DevMode/Console',
      tip: 'Manual triggers are perfect for testing'
    });
  } else {
    return response.json({
      message: `Triggered via: ${trigger}`,
      availableTriggers: ['webhook', 'cron', 'manual', 'agent', 'sms', 'email']
    });
  }
}

export const welcome = () => ({
  welcome: 'Learn how agents respond to different trigger types (webhook, cron, manual).',
  prompts: [
    { data: 'Test manual trigger', contentType: 'text/plain' },
    { data: JSON.stringify({ test: 'data' }), contentType: 'application/json' }
  ]
});
