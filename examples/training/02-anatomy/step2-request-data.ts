import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Check content type to determine how to parse data
  const contentType = request.data.contentType;

  context.logger.info(`Request content type: ${contentType}`);

  let requestData: any;

  // Handle different data formats
  if (contentType.includes('application/json')) {
    requestData = await request.data.json();
    context.logger.info('Parsed as JSON', { data: requestData });
  } else if (contentType.includes('text/plain')) {
    requestData = await request.data.text();
    context.logger.info('Parsed as text', { length: requestData.length });
  } else {
    requestData = await request.data.binary();
    context.logger.info('Parsed as binary', { size: requestData.byteLength });
  }

  // Access metadata - multiple approaches:

  // Approach 1: Using request.get() - SDK convenience method (recommended)
  const sessionId = request.get('session_id', 'no-session');
  const userId = request.get('user_id', 'anonymous');

  // Approach 2: Direct property access on metadata object
  // const sessionId = request.metadata.session_id || 'no-session';
  // const userId = request.metadata.user_id || 'anonymous';

  // Approach 3: Using optional chaining (safest for nested properties)
  // const sessionId = request.metadata?.session_id ?? 'no-session';
  // const userId = request.metadata?.user_id ?? 'anonymous';

  return response.json({
    received: {
      contentType,
      dataType: typeof requestData,
      sessionId,
      userId
    },
    message: 'Successfully parsed request data'
  });
}
