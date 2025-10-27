from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime

def welcome():
    return {
        'welcome': 'Store conversation history in session memory with automatic TTL-based expiry.',
        'prompts': [
            {'data': 'Hello, this is my first message', 'contentType': 'text/plain'},
            {'data': 'Here is my second message', 'contentType': 'text/plain'},
            {'data': 'And a third message', 'contentType': 'text/plain'}
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    bucket = 'demo-sessions'
    key = 'chat-history'

    # Initialize messages array
    messages = []

    # Retrieve existing session data
    try:
        result = await context.kv.get(bucket, key)

        if result.exists:
            # Session exists - load conversation history
            messages = await result.data.json()
            context.logger.info(f'Loaded {len(messages)} existing messages')
        else:
            context.logger.info('Starting new session')
    except Exception as error:
        context.logger.error(f'Error retrieving session: {error}')
        # Continue with empty array if retrieval fails

    # Get user message
    user_message = await request.data.text()

    # Add the new user message
    messages.append({
        'role': 'user',
        'content': user_message,
        'timestamp': datetime.now().isoformat()
    })

    # Save conversation with 1-hour TTL (automatic expiration)
    # Note: Omit the ttl parameter for permanent storage
    await context.kv.set(bucket, key, messages, {
        'ttl': 3600  # 1 hour in seconds
    })

    context.logger.info(f'Saved {len(messages)} messages with 1-hour TTL')

    # Return conversation summary
    return response.json({
        'message': 'Message saved to session memory',
        'messageCount': len(messages),
        'expiresIn': '1 hour'
    })
