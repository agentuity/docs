import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  context.logger.info('Agent invoked');

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

  // Track total requests using KV storage
  const result = await context.kv.get('request-stats', 'total-requests');
  let count = 1;
  if (result.exists) {
    count = Number(await result.data.text()) + 1;
  }
  await context.kv.set('request-stats', 'total-requests', String(count));

  context.logger.info('Request processed', { requestNumber: count });

  return response.json({
    message: 'Request received',
    contentType: request.data.contentType,
    received: receivedData,
    stats: { totalRequests: count },
    timestamp: new Date().toISOString()
  });
}

export const welcome = () => ({
  welcome: 'Send multiple requests and watch the counter increment!',
  prompts: [
    { data: JSON.stringify({ test: 'request 1' }), contentType: 'application/json' },
    { data: JSON.stringify({ test: 'request 2' }), contentType: 'application/json' },
    { data: 'Request 3', contentType: 'text/plain' }
  ]
});
