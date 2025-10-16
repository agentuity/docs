from datetime import datetime
from agentuity import AgentRequest, AgentResponse, AgentContext

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    context.logger.info("Hello agent received a request")

    # Safe input handling with error checking
    name = "World"
    try:
        data = await request.data.json()

        if not data.get("name") or not isinstance(data.get("name"), str):
            context.logger.warning("No valid name provided in request")
            return response.json({"error": "Name is required and must be a string"})

        name = data["name"]
    except Exception as e:
        context.logger.error(f"Error parsing request: {e}")
        return response.json({"error": "Invalid JSON in request body"})

    # Get current greeting count with error handling
    count = 1
    try:
        counter_result = await context.kv.get("stats", "greeting_count")

        if counter_result.exists:
            count = await counter_result.data.json()
            count += 1

        await context.kv.set("stats", "greeting_count", count)
    except Exception as e:
        context.logger.error(f"Error accessing storage: {e}")
        # Continue with default count rather than failing

    context.logger.info(f"Greeting #{count} for {name}")

    return response.json({
        "message": f"Hello, {name}!",
        "greeting_number": count,
        "timestamp": datetime.now().isoformat()
    })
