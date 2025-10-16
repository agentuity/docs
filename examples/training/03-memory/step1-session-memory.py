from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime
from aiohttp.web import Response

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    bucket = "demo-sessions"
    session_id = context.sessionId  # Use the current session ID

    try:
        # Get the user's message
        user_message = await request.data.text()

        # Retrieve existing session data
        result = await context.kv.get(bucket, session_id)

        if result.exists:
            # Session exists - load conversation history
            messages = await result.data.json()
            context.logger.info(f"Loaded {len(messages)} existing messages")
        else:
            # New session - initialize conversation
            messages = []
            context.logger.info("Starting new session")

        # Add the new user message
        messages.append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })

        # Save conversation with 1-hour TTL (automatic cleanup)
        await context.kv.set(bucket, session_id, messages, {
            "ttl": 3600  # 1 hour in seconds
        })

        context.logger.info(f"Saved {len(messages)} messages with 1-hour TTL")

        # Return conversation summary
        return response.json({
            "message": "Message saved to session memory",
            "messageCount": len(messages),
            "sessionId": session_id,
            "expiresIn": "1 hour"
        })

    except Exception as error:
        context.logger.error(f"Error managing session memory: {error}")
        return Response(text="Internal Server Error", status=500)
