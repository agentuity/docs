from agentuity import AgentRequest, AgentResponse, AgentContext

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Log the incoming request
    context.logger.info("Hello agent received a request")

    # Get the name from request data
    data = await request.data.json()
    name = data.get("name", "World")

    context.logger.info(f"Greeting {name}")

    # Return a simple greeting
    return response.json({"message": f"Hello, {name}!"})
