import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  // Extract different types of user request data
  const contentType = req.data.contentType;
  ctx.logger.info('Content type: %s', contentType);
  
  const demoUserEmail = "demo@ai.com";
  let userData = await req.data.json();
  
  
  // Return response with extracted data
  return resp.json({
    message: 'Request processed successfully',
  });
}
