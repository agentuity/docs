import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // INFO: Normal flow - track what's happening
  context.logger.info('Processing request started', {
    agentId: context.agent.id,
    agentName: context.agent.name,
    sessionId: context.sessionId,
    trigger: request.trigger
  });

  const data = await request.data.json();
  const taskType = data.task || 'unknown';

  // DEBUG: Detailed information for troubleshooting
  context.logger.debug('Request details', {
    taskType,
    dataKeys: Object.keys(data),
    timestamp: new Date().toISOString()
  });

  // Simulate different outcomes
  if (taskType === 'risky') {
    // WARN: Potential issues that don't stop execution
    context.logger.warn('Risky task detected', {
      taskType,
      recommendation: 'Review before proceeding'
    });
  }

  if (taskType === 'error') {
    // ERROR: Failures requiring attention
    context.logger.error('Task execution failed', {
      taskType,
      reason: 'Invalid task type',
      action: 'Returning error response'
    });

    return response.json({
      error: 'Task failed',
      details: 'Invalid task type: error'
    });
  }

  // Log successful completion
  context.logger.info('Request processed successfully', {
    taskType,
    duration: '45ms'
  });

  return response.json({
    success: true,
    taskType,
    message: 'Task completed'
  });
}
