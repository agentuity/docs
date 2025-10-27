from agentuity import AgentRequest, AgentResponse, AgentContext
import json
from datetime import datetime

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    context.logger.info('Agent invoked', {'contentType': request.data.content_type})

    received_data = None

    if request.data.content_type == 'application/json':
        received_data = await request.data.json()
    elif request.data.content_type == 'text/plain':
        received_data = await request.data.text()
    else:
        received_data = await request.data.text()

    context.logger.info('Request received', {'data': received_data})

    return response.json({
        'message': 'Request received and logged',
        'contentType': request.data.content_type,
        'received': received_data,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

def welcome():
    return {
        'welcome': 'Send data and watch the logs appear in DevMode.',
        'prompts': [
            {'data': json.dumps({'action': 'test', 'value': 123}), 'contentType': 'application/json'},
            {'data': 'Testing logs', 'contentType': 'text/plain'}
        ]
    }
