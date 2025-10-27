from agentuity import AgentRequest, AgentResponse, AgentContext
import json

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get the content type and trigger information
    content_type = request.data.content_type
    trigger = request.trigger

    context.logger.info(f"Processing {content_type} request via {trigger} trigger")

    # Parse data based on content type
    parsed_data = None

    if "application/json" in content_type:
        parsed_data = await request.data.json()
        context.logger.info(f"Parsed as JSON keys={list(parsed_data.keys())}")
    elif "text/plain" in content_type:
        parsed_data = await request.data.text()
        context.logger.info(f"Parsed as text length={len(parsed_data)}")
    else:
        parsed_data = await request.data.binary()
        context.logger.info(f"Parsed as binary size={len(parsed_data)}")

    # Return parsed data with request metadata
    return response.json({
        "received": parsed_data,
        "request": {
            "contentType": content_type,
            "trigger": trigger,
            "metadata": request.metadata or {}
        },
        "message": "Successfully parsed request data"
    })

def welcome():
    return {
        'welcome': 'Learn how to parse different data formats and access request properties.',
        'prompts': [
            {'data': json.dumps({'message': 'Hello', 'count': 42}), 'contentType': 'application/json'},
            {'data': 'Plain text message', 'contentType': 'text/plain'},
            {'data': 'Another message', 'contentType': 'text/plain'}
        ]
    }
