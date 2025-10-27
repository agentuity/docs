from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime
import json

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Parse data based on content type
    if request.data.content_type == 'application/json':
        received_data = await request.data.json()
    elif request.data.content_type == 'text/plain':
        received_data = await request.data.text()
    else:
        received_data = await request.data.text()

    # INFO: Normal flow - track what's happening
    context.logger.info(
        f"Processing request started agent_id={context.agent.id} "
        f"trigger={request.trigger} content_type={request.data.content_type}"
    )

    # DEBUG: Detailed information for troubleshooting
    context.logger.debug(
        f"Request details data={received_data} timestamp={datetime.now().isoformat()}"
    )

    # WARN: Demonstrate warning level (non-critical issues)
    context.logger.warning(
        f"Example warning message note='Warnings indicate potential issues but execution continues'"
    )

    # ERROR: Demonstrate error level
    context.logger.error(
        f"Example error message error_type=demonstration"
    )

    return response.json({
        "message": "Check the logs below to see different log levels",
        "received": received_data
    })

def welcome():
    return {
        'welcome': 'Use structured logging with different levels (info, debug, warn, error).',
        'prompts': [
            {'data': 'Testing structured logging', 'contentType': 'text/plain'},
            {'data': json.dumps({'user': 'testuser', 'action': 'checkout'}), 'contentType': 'application/json'}
        ]
    }
