import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  let receivedData: unknown = null;

  // Check content type first, then parse accordingly
  switch (request.data.contentType) {
    case 'application/json':
      receivedData = await request.data.json();
      break;
    case 'text/plain':
      receivedData = await request.data.text();
      break;
    default:
      receivedData = await request.data.text();
  }

  return response.json({
    message: 'Request received',
    contentType: request.data.contentType,
    received: receivedData,
    timestamp: new Date().toISOString()
  });
}

export const welcome = () => ({
  welcome: 'Welcome to your first agent! Send JSON or text data and see it echoed back.',
  prompts: [
    { data: JSON.stringify({ hello: 'world' }), contentType: 'application/json' },
    { data: 'Hello, world!', contentType: 'text/plain' }
  ]
});
