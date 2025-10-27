import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Get the content type and trigger information
  const contentType = request.data.contentType;
  const trigger = request.trigger;

  context.logger.info(`Processing ${contentType} request via ${trigger} trigger`);

  // Parse data based on content type
  let parsedData: any;

  if (contentType.includes('application/json')) {
    parsedData = await request.data.json();
    context.logger.info('Parsed as JSON', { keys: Object.keys(parsedData) });
  } else if (contentType.includes('text/plain')) {
    parsedData = await request.data.text();
    context.logger.info('Parsed as text', { length: parsedData.length });
  } else {
    parsedData = await request.data.binary();
    context.logger.info('Parsed as binary', { size: parsedData.byteLength });
  }

  // Return parsed data with request metadata
  return response.json({
    received: parsedData,
    request: {
      contentType,
      trigger,
      metadata: request.metadata || {}
    },
    message: 'Successfully parsed request data'
  });
}

export const welcome = () => ({
  welcome: 'Learn how to parse different data formats and access request properties.',
  prompts: [
    { data: JSON.stringify({ message: 'Hello', count: 42 }), contentType: 'application/json' },
    { data: 'Plain text message', contentType: 'text/plain' }
  ]
});
