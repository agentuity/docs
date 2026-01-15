from agentuity import AgentRequest, AgentResponse, AgentContext
from opentelemetry.trace import StatusCode
import json
import time
import asyncio


async def run(request: AgentRequest, response: AgentResponse, ctx: AgentContext):
    """Demonstrates custom spans for performance tracking."""
    # Get data in the appropriate format
    content_type = request.data.content_type
    if content_type == "application/json":
        data = await request.data.json()
        is_text = False
    else:
        data = await request.data.text()
        is_text = True

    # Create a span for processing using ctx.tracer.start_as_current_span
    with ctx.tracer.start_as_current_span("process-data") as span:
        try:
            # Add common attributes
            span.set_attribute("trigger", str(request.trigger))
            span.set_attribute("contentType", content_type)

            # Add type-specific attributes
            if is_text:
                span.set_attribute("message.content", data)
                span.set_attribute("message.length", len(data))
            else:
                span.set_attribute("data.json", json.dumps(data))
                span.set_attribute("data.type", type(data).__name__)

            # Add event to mark processing start
            span.add_event(
                "processing-started",
                {"timestamp": int(time.time() * 1000), "hasData": data is not None},
            )

            # Simulate some processing work
            await asyncio.sleep(0.1)

            # Process the data
            result = {"message": "Event processed and traced", "data": data, "traced": True}

            span.add_event("processing-completed", result)

            # Set status to OK
            span.set_status(StatusCode.OK)

            return response.json(result)

        except Exception as e:
            # Record exception and set error status
            span.record_exception(e)
            span.set_status(StatusCode.ERROR, str(e))
            ctx.logger.error("Error running agent", {"error": str(e)})
            raise
