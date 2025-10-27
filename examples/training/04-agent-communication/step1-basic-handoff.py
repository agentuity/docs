from agentuity import AgentRequest, AgentResponse, AgentContext

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Simple delegation - pass control to a specialist agent
    # This agent exits immediately after handoff
    context.logger.info('Delegating to specialist agent')

    return response.handoff({"name": "specialist-agent"})

def welcome():
    import json
    return {
        'welcome': 'Learn basic agent delegation using response.handoff() to transfer control.',
        'prompts': [
            {'data': 'Delegate this task', 'contentType': 'text/plain'},
            {'data': json.dumps({'task': 'process'}), 'contentType': 'application/json'}
        ]
    }
