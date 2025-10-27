import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Parse data based on content type
  let receivedData: unknown;

  switch (request.data.contentType) {
    case 'application/json':
      receivedData = await request.data.json();
      break;
    case 'text/plain':
      receivedData = await request.data.text();
      break;
    default:
      receivedData = await request.data.text();
      break;
  }

  // INFO: Normal flow - track what's happening
  context.logger.info('Processing request started', {
    agentId: context.agent.id,
    trigger: request.trigger,
    contentType: request.data.contentType
  });

  // DEBUG: Detailed information for troubleshooting
  context.logger.debug('Request details', {
    data: receivedData,
    timestamp: new Date().toISOString()
  });

  // WARN: Demonstrate warning level (non-critical issues)
  context.logger.warn('Example warning message', {
    note: 'Warnings indicate potential issues but execution continues'
  });

  // ERROR: Demonstrate error level
  context.logger.error('Example error message', {
    errorType: 'demonstration'
  });

  return response.json({
    message: 'Check the logs below to see different log levels',
    received: receivedData
  });
}

export const welcome = () => ({
  welcome: 'Use structured logging with different levels (info, debug, warn, error).',
  prompts: [
    { data: 'Testing structured logging', contentType: 'text/plain' },
    { data: JSON.stringify({ user: 'testuser', action: 'checkout' }), contentType: 'application/json' }
  ]
});
