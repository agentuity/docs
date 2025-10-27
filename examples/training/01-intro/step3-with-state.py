from agentuity import AgentRequest, AgentResponse, AgentContext
import json
from datetime import datetime

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    context.logger.info('Agent invoked')

    received_data = None

    if request.data.content_type == 'application/json':
        received_data = await request.data.json()
    elif request.data.content_type == 'text/plain':
        received_data = await request.data.text()
    else:
        received_data = await request.data.text()

    # Track total requests using KV storage
    result = await context.kv.get('request-stats', 'total-requests')
    count = 1
    if result.exists:
        count = int(await result.data.text()) + 1
    await context.kv.set('request-stats', 'total-requests', str(count))

    context.logger.info('Request processed', {'requestNumber': count})

    return response.json({
        'message': 'Request received',
        'contentType': request.data.content_type,
        'received': received_data,
        'stats': {'totalRequests': count},
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

def welcome():
    return {
        'welcome': 'Send multiple requests and watch the counter increment!',
        'prompts': [
            {'data': json.dumps({'test': 'request 1'}), 'contentType': 'application/json'},
            {'data': json.dumps({'test': 'request 2'}), 'contentType': 'application/json'},
            {'data': 'Request 3', 'contentType': 'text/plain'}
        ]
    }
