import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { SpanStatusCode } from "@opentelemetry/api";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Get data in the appropriate format
  let prompt: unknown;
  switch (request.data.contentType) {
    case 'application/json':
      prompt = await request.data.json();
      break;
    case 'text/plain':
      prompt = await request.data.text();
      break;
    default:
      prompt = await request.data.text();
      break;
  }

  // Create a span for processing
  return context.tracer.startActiveSpan('process-data', async (span) => {
    try {
      // Add common attributes
      span.setAttribute('trigger', request.trigger);
      span.setAttribute('contentType', request.data.contentType);

      // Add type-specific attributes
      if (request.data.contentType === 'text/plain') {
        span.setAttribute('message.content', prompt as string);
        span.setAttribute('message.length', (prompt as string).length);
      } else {
        span.setAttribute('data.json', JSON.stringify(prompt));
        span.setAttribute('data.type', typeof prompt);
      }

      // Add event to mark processing start
      const startEvent = request.data.contentType === 'text/plain'
        ? { timestamp: Date.now() }
        : { timestamp: Date.now(), hasData: prompt !== null, dataType: typeof prompt };

      span.addEvent('processing-started', startEvent);

      // Simulate some processing work
      await new Promise(resolve => setTimeout(resolve, 100));

      // Process the data
      const result = {
        message: 'Event processed and traced',
        data: prompt as string,
        traced: true
      };

      span.addEvent('processing-completed', result);

      // Set status to OK
      span.setStatus({ code: SpanStatusCode.OK });

      return response.json(result);

    } catch (error) {
      // Record exception and set error status
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      context.logger.error('Error running agent:', error);
      throw error;
    }
  });
}
