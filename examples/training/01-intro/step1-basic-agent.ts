import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Get the name from request data
  const data = await request.data.json();
  const name = data.name || 'World';

  // Return a simple greeting
  return response.json({ message: `Hello, ${name}!` });
}
