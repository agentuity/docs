from agentuity import AgentRequest, AgentResponse, AgentContext

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get the name from request data
    data = await request.data.json()
    name = data.get("name", "World")

    # Return a simple greeting
    return response.json({"message": f"Hello, {name}!"})
