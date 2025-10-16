import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  context.logger.info('Hello agent received a request');

  // Safe input handling with error checking
  let name = 'World';
  try {
    const data = await request.data.json();

    if (!data.name || typeof data.name !== 'string') {
      context.logger.warn('No valid name provided in request');
      return response.json({
        error: 'Name is required and must be a string'
      });
    }

    name = data.name;
  } catch (error) {
    context.logger.error(`Error parsing request: ${error}`);
    return response.json({
      error: 'Invalid JSON in request body'
    });
  }

  // Get current greeting count with error handling
  let count = 1;
  try {
    const counterResult = await context.kv.get('stats', 'greeting_count');

    if (counterResult.exists) {
      count = await counterResult.data.json();
      count++;
    }

    await context.kv.set('stats', 'greeting_count', count);
  } catch (error) {
    context.logger.error(`Error accessing storage: ${error}`);
    // Continue with default count rather than failing
  }

  context.logger.info(`Greeting #${count} for ${name}`);

  return response.json({
    message: `Hello, ${name}!`,
    greeting_number: count,
    timestamp: new Date().toISOString()
  });
}
