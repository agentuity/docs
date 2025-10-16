from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # INFO: Normal flow - track what's happening
    context.logger.info(
        f"Processing request started agent_id={context.agent.id} "
        f"agent_name={context.agent.name} session_id={context.sessionId} "
        f"trigger={request.trigger}"
    )

    data = await request.data.json()
    task_type = data.get("task", "unknown")

    # DEBUG: Detailed information for troubleshooting
    context.logger.debug(
        f"Request details task_type={task_type} "
        f"data_keys={list(data.keys())} timestamp={datetime.now().isoformat()}"
    )

    # Simulate different outcomes
    if task_type == "risky":
        # WARNING: Potential issues that don't stop execution
        context.logger.warning(
            f"Risky task detected task_type={task_type} "
            f"recommendation='Review before proceeding'"
        )

    if task_type == "error":
        # ERROR: Failures requiring attention
        context.logger.error(
            f"Task execution failed task_type={task_type} "
            f"reason='Invalid task type' action='Returning error response'"
        )

        return response.json({
            "error": "Task failed",
            "details": "Invalid task type: error"
        })

    # Log successful completion
    context.logger.info(
        f"Request processed successfully task_type={task_type} duration=45ms"
    )

    return response.json({
        "success": True,
        "taskType": task_type,
        "message": "Task completed"
    })
