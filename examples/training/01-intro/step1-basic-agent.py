from agentuity import AgentRequest, AgentResponse, AgentContext
import json
from datetime import datetime

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    received_data = None

    # Check content type first, then parse accordingly
    if request.data.content_type == 'application/json':
        received_data = await request.data.json()
    elif request.data.content_type == 'text/plain':
        received_data = await request.data.text()
    else:
        received_data = await request.data.text()

    return response.json({
        'message': 'Request received',
        'contentType': request.data.content_type,
        'received': received_data,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

def welcome():
    return {
        'welcome': 'Welcome to your first agent! Send JSON or text data and see it echoed back.',
        'prompts': [
            {'data': json.dumps({'hello': 'world'}), 'contentType': 'application/json'},
            {'data': 'Hello, world!', 'contentType': 'text/plain'}
        ]
    }
