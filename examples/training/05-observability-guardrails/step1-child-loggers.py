from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get request data
    data = await request.data.json()
    user_id = data.get("userId", "unknown")
    request_id = data.get("requestId", context.runId)

    # Note: Child logger functionality coming soon for API consistency
    # Current approach: Include context in each log message

    # Log processing start
    context.logger.info(f"Processing request started request_id={request_id} user_id={user_id}")

    try:
        # Simulate some processing steps
        context.logger.debug(f"Validating input data request_id={request_id}")

        if not data.get("query"):
            context.logger.warning(f"Missing query field request_id={request_id} user_id={user_id}")
            return response.json({"error": "Query is required"})

        query = data["query"]
        context.logger.debug(f"Processing query request_id={request_id} query_length={len(query)}")

        # Simulate successful processing
        result = {
            "message": "Request processed successfully",
            "query": query,
            "processedAt": datetime.now().isoformat()
        }

        context.logger.info(f"Processing completed successfully request_id={request_id} user_id={user_id}")

        return response.json(result)

    except Exception as error:
        # Error logs also include the context
        context.logger.error(f"Error processing request request_id={request_id} user_id={user_id} error={str(error)}")
        raise  # SDK returns 500 automatically
