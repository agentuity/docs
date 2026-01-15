from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime


async def run(request: AgentRequest, response: AgentResponse, ctx: AgentContext):
    """Demonstrates logging with context for easier debugging."""
    data = await request.data.json()
    user_id = data.get("userId", "unknown")
    request_id = data.get("requestId", ctx.run_id)

    # Python SDK child logging coming soon
    # For now, include context manually in structured logs
    log_context = {"requestId": request_id, "userId": user_id}

    # Log processing start
    ctx.logger.info("Processing request started", log_context)

    # Simulate some processing steps
    ctx.logger.debug("Validating input data", log_context)

    query = data.get("query")
    if not query:
        ctx.logger.warning("Missing query field", log_context)
        return response.json({"error": "Query is required"})

    ctx.logger.debug("Processing query", {**log_context, "queryLength": len(query)})

    # Simulate successful processing
    result = {
        "message": "Request processed successfully",
        "query": query,
        "processedAt": datetime.now().isoformat(),
    }

    ctx.logger.info("Processing completed successfully", log_context)

    return response.json(result)
