import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Get the message from the request
  const { message } = await request.data.json();

  context.logger.info('Getting specialist agent handle');

  // Get a reference to the specialist agent
  const agent = await context.getAgent({ name: 'message-processor' });

  context.logger.info('Running specialist agent and waiting for response');

  // Run the agent and wait for its response
  // SDK auto-detects content type from data (object → application/json)
  const agentResponse = await agent.run({
    data: { message }
  });

  // Process the response from the specialist
  const result = await agentResponse.data.json();

  // Return enhanced results to the client
  return response.json({
    original: message,
    processed: result,
    handledBy: context.agent.name
  });
}
