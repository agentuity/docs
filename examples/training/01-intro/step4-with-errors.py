from agentuity import AgentRequest, AgentResponse, AgentContext
import json
from datetime import datetime

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    context.logger.info('Agent invoked')

    received_data = None

    # Parse with error handling
    try:
        if request.data.content_type == 'application/json':
            received_data = await request.data.json()
        elif request.data.content_type == 'text/plain':
            received_data = await request.data.text()
        else:
            received_data = await request.data.text()
    except Exception as error:
        context.logger.error('Failed to parse request data', {'error': str(error)})
        return response.json(
            {'error': 'Invalid request data'},
            status=400
        )

    # Track total requests with error handling
    count = 1
    try:
        result = await context.kv.get('request-stats', 'total-requests')
        if result.exists:
            count = int(await result.data.text()) + 1
        await context.kv.set('request-stats', 'total-requests', str(count))
    except Exception as error:
        context.logger.error('KV storage error', {'error': str(error)})
        # Continue with default count - graceful degradation

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
        'welcome': 'Test error handling by sending valid and invalid data.',
        'prompts': [
            {'data': json.dumps({'valid': 'data'}), 'contentType': 'application/json'},
            {'data': 'Valid text', 'contentType': 'text/plain'}
        ]
    }
