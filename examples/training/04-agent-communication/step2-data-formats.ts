import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Demonstrate different ways to pass data when handing off

  // Example 1: Pass plain text with explicit content type
  context.logger.info('Example: Passing plain text to analyzer');
  // Uncomment to use:
  // return response.handoff(
  //   { name: 'text-analyzer' },
  //   { data: "Analyze this text", contentType: "text/plain" }
  // );

  // Example 2: Pass JSON object (SDK auto-detects application/json)
  context.logger.info('Example: Passing JSON object to processor');
  return response.handoff(
    { name: 'data-processor' },
    {
      data: {
        message: "Process this data",
        timestamp: new Date().toISOString()
      }
    }
  );

  // Example 3: Pass original request as-is (no data parameter)
  // Uncomment to use:
  // context.logger.info('Example: Forwarding original request');
  // return response.handoff({ name: 'passthrough-agent' });
}

export const welcome = () => ({
  welcome: 'Pass different data formats (text, JSON) when handing off to other agents.',
  prompts: [
    { data: JSON.stringify({ message: 'First request' }), contentType: 'application/json' },
    { data: JSON.stringify({ message: 'Second request', priority: 'high' }), contentType: 'application/json' }
  ]
});
