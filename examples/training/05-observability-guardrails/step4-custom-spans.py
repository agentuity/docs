from agentuity import AgentRequest, AgentResponse, AgentContext
from opentelemetry.trace.status import Status, StatusCode
import asyncio
import time

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get data in the appropriate format
    if request.data.content_type == 'application/json':
        prompt = await request.data.json()
    elif request.data.content_type == 'text/plain':
        prompt = await request.data.text()
    else:
        prompt = await request.data.text()

    # Create a span for processing
    with context.tracer.start_as_current_span("process-data") as span:
        try:
            # Add attributes to the span
            span.set_attribute("trigger", request.trigger)
            span.set_attribute("contentType", request.data.content_type)

            # Add type-specific attributes
            if request.data.content_type == 'application/json':
                span.set_attribute("data.type", "json")
                if isinstance(prompt, dict) and "user" in prompt:
                    span.set_attribute("user", prompt["user"])
                if isinstance(prompt, dict) and "action" in prompt:
                    span.set_attribute("action", prompt["action"])
            else:
                span.set_attribute("data.type", "text")
                span.set_attribute("message.length", len(str(prompt)))

            # Add events to the span
            span.add_event("processing-started", {
                "timestamp": int(time.time() * 1000),
                "hasData": prompt is not None
            })

            # Simulate some processing work
            await asyncio.sleep(0.1)

            # Process the data
            result = {
                'message': 'Event processed and traced successfully',
                'data': str(prompt),
                'traced': True
            }

            # Add completion event
            span.add_event("processing-completed", {
                "success": True
            })

            # Set status to OK
            span.set_status(Status(StatusCode.OK))

            return response.json(result)

        except Exception as error:
            # Record the error in the span
            span.record_exception(error)
            span.set_status(Status(StatusCode.ERROR))
            context.logger.error(f"Error processing data: {str(error)}")
            raise
