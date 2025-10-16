import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  context.logger.info('Hello agent received a request');

  const data = await request.data.json();
  const name = data.name || 'World';

  // Get current greeting count from KV storage
  const counterResult = await context.kv.get('stats', 'greeting_count');
  let count: number;

  if (counterResult.exists) {
    count = await counterResult.data.json();
    count++;
  } else {
    count = 1;
  }

  // Update the counter
  await context.kv.set('stats', 'greeting_count', count);

  context.logger.info(`Greeting #${count} for ${name}`);

  return response.json({
    message: `Hello, ${name}!`,
    greeting_number: count,
    timestamp: new Date().toISOString()
  });
}
