import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  context.logger.info('Agent invoked');

  let receivedData: unknown = null;

  // Parse with error handling
  try {
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
  } catch (error) {
    context.logger.error('Failed to parse request data', { error });
    return response.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }

  // Track total requests with error handling
  let count = 1;
  try {
    const result = await context.kv.get('request-stats', 'total-requests');
    if (result.exists) {
      count = Number(await result.data.text()) + 1;
    }
    await context.kv.set('request-stats', 'total-requests', String(count));
  } catch (error) {
    context.logger.error('KV storage error', { error });
    // Continue with default count - graceful degradation
  }

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
  welcome: 'Test error handling by sending valid and invalid data.',
  prompts: [
    { data: JSON.stringify({ valid: 'data' }), contentType: 'application/json' },
    { data: 'Valid text', contentType: 'text/plain' }
  ]
});
