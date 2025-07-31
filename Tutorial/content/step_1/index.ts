import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function CustomerSupportAgent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Log that we received a request
  context.logger.info("Customer support agent received request");
  
  const requestText = await request.data.text();
  
  // Log request details
  context.logger.info("Request details", {
    data: requestText,
    timestamp: new Date().toISOString()
  });

  // Return a JSON response acknowledging the user's request
  return response.json({
    message: `Thank you for your request. Our agent is working on your request: ${JSON.stringify(requestText)}`,
    timestamp: new Date().toISOString(),
  });
}