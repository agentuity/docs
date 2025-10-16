from datetime import datetime
from agentuity import AgentRequest, AgentResponse, AgentContext

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    context.logger.info("Hello agent received a request")

    data = await request.data.json()
    name = data.get("name", "World")

    # Get current greeting count from KV storage
    counter_result = await context.kv.get("stats", "greeting_count")

    if counter_result.exists:
        count = await counter_result.data.json()
        count += 1
    else:
        count = 1

    # Update the counter
    await context.kv.set("stats", "greeting_count", count)

    context.logger.info(f"Greeting #{count} for {name}")

    return response.json({
        "message": f"Hello, {name}!",
        "greeting_number": count,
        "timestamp": datetime.now().isoformat()
    })
