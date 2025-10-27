import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  context.logger.info('Agent invoked', { contentType: request.data.contentType });

  let receivedData: unknown = null;

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

  context.logger.info('Request received', { data: receivedData });

  return response.json({
    message: 'Request received and logged',
    contentType: request.data.contentType,
    received: receivedData,
    timestamp: new Date().toISOString()
  });
}

export const welcome = () => ({
  welcome: 'Send data and watch the logs appear in DevMode.',
  prompts: [
    { data: JSON.stringify({ action: 'test', value: 123 }), contentType: 'application/json' },
    { data: 'Testing logs', contentType: 'text/plain' }
  ]
});
