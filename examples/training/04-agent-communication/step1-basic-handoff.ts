import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Simple delegation - pass control to a specialist agent
  // This agent exits immediately after handoff
  context.logger.info('Delegating to specialist agent');

  return response.handoff({ name: 'specialist-agent' });
}

export const welcome = () => ({
  welcome: 'Learn basic agent delegation using response.handoff() to transfer control.',
  prompts: [
    { data: 'Delegate this task', contentType: 'text/plain' },
    { data: JSON.stringify({ task: 'process' }), contentType: 'application/json' }
  ]
});
