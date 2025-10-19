from agentuity import AgentRequest, AgentResponse, AgentContext

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Simple delegation - pass control to a specialist agent
    # This agent exits immediately after handoff
    context.logger.info('Delegating to specialist agent')

    return response.handoff({"name": "specialist-agent"})
