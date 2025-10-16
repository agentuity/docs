from agentuity import AgentRequest, AgentResponse, AgentContext

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get the message from the request
    data = await request.data.json()
    message = data.get('message')

    context.logger.info('Getting specialist agent handle')

    # Get a reference to the specialist agent
    agent = await context.get_agent({"name": "message-processor"})

    context.logger.info('Running specialist agent and waiting for response')

    # Run the agent and wait for its response
    agent_response = await agent.run({"message": message})

    # Process the response from the specialist
    result = await agent_response.data.json()

    # Return enhanced results to the client
    return response.json({
        "original": message,
        "processed": result,
        "handledBy": context.agent.name
    })
