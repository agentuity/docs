from agentuity import AgentRequest, AgentResponse, AgentContext

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Check content type to determine how to parse data
    content_type = request.data.content_type

    context.logger.info(f"Request content type: {content_type}")

    request_data = None

    # Handle different data formats
    if "application/json" in content_type:
        request_data = await request.data.json()
        context.logger.info(f"Parsed as JSON data={request_data}")
    elif "text/plain" in content_type:
        request_data = await request.data.text()
        context.logger.info(f"Parsed as text length={len(request_data)}")
    else:
        request_data = await request.data.binary()
        context.logger.info(f"Parsed as binary size={len(request_data)}")

    # Access metadata - multiple approaches:

    # Approach 1: Using request.get() - SDK convenience method (recommended)
    session_id = request.get("session_id", "no-session")
    user_id = request.get("user_id", "anonymous")

    # Approach 2: Using metadata property (returns dict) with dict.get()
    # session_id = request.metadata.get("session_id", "no-session")
    # user_id = request.metadata.get("user_id", "anonymous")

    # Approach 3: Direct dictionary access (raises KeyError if missing)
    # session_id = request.metadata.get("session_id", "no-session")  # Same as approach 2
    # Or without default: session_id = request.metadata["session_id"]

    return response.json({
        "received": {
            "contentType": content_type,
            "dataType": type(request_data).__name__,
            "sessionId": session_id,
            "userId": user_id
        },
        "message": "Successfully parsed request data"
    })
