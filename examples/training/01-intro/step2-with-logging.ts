import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Log the incoming request
  context.logger.info('Hello agent received a request');

  // Get the name from request data
  const data = await request.data.json();
  const name = data.name || 'World';

  context.logger.info(`Greeting ${name}`);

  // Return a simple greeting
  return response.json({ message: `Hello, ${name}!` });
}
