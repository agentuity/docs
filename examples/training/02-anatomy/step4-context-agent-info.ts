import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const prompt = await request.data.text();

  context.logger.info(`Received: ${prompt}`);

  // Show agent information
  if (prompt === 'Agent Info') {
    return response.json({
      agent: {
        id: context.agent.id,
        name: context.agent.name,
        description: context.agent.description || 'No description'
      },
      message: 'Current agent details'
    });
  }

  // Show runtime/environment information
  if (prompt === 'Runtime Info') {
    return response.json({
      runtime: {
        sdkVersion: context.sdkVersion,
        devmode: context.devmode,
        projectId: context.projectId,
        deploymentId: context.deploymentId
      },
      message: 'Runtime and environment information'
    });
  }

  // Show available platform services
  if (prompt === 'Platform Services') {
    return response.json({
      services: {
        storage: ['kv', 'vector', 'objectstore'],
        observability: ['logger', 'tracer'],
        communication: ['getAgent', 'email']
      },
      message: 'Access these services via the context object',
      example: 'context.kv, context.logger, context.getAgent(), etc.'
    });
  }

  // Default response
  return response.json({
    message: 'Try one of the example prompts to explore agent context',
    availableCommands: ['Agent Info', 'Runtime Info', 'Platform Services']
  });
}

export const welcome = () => ({
  welcome: 'Explore the agent context object and available platform services.',
  prompts: [
    { data: 'Agent Info', contentType: 'text/plain' },
    { data: 'Runtime Info', contentType: 'text/plain' },
    { data: 'Platform Services', contentType: 'text/plain' }
  ]
});
