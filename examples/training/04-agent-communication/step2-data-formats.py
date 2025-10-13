from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Demonstrate different ways to pass data when handing off
    # Python infers content type from data type automatically

    # Example 1: Pass plain text (inferred as text/plain)
    context.logger.info('Example: Passing plain text to analyzer')
    # Uncomment to use:
    # return response.handoff(
    #     {"name": "text-analyzer"},
    #     "Analyze this text"  # String → text/plain
    # )

    # Example 2: Pass dict (inferred as application/json)
    context.logger.info('Example: Passing JSON object to processor')
    return response.handoff(
        {"name": "data-processor"},
        {
            "message": "Process this data",
            "timestamp": datetime.now().isoformat()
        }  # Dict → application/json
    )

    # Example 3: Pass original request as-is (no data parameter)
    # Uncomment to use:
    # context.logger.info('Example: Forwarding original request')
    # return response.handoff({"name": "passthrough-agent"})
