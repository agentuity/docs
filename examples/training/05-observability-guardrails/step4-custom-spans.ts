import { createAgent } from '@agentuity/runtime';
import { SpanStatusCode } from '@opentelemetry/api';

export default createAgent('custom-span-demo', {
  handler: async (ctx, input) => {
    // Determine input type
    const isText = typeof input === 'string';
    const data = isText ? input : (input as { data: unknown }).data;

    // Create a span for processing using ctx.tracer.startSpan
    const span = ctx.tracer.startSpan('process-data');
    try {
      // Add common attributes
      span.setAttribute('input.type', isText ? 'text' : 'json');

      // Add type-specific attributes
      if (isText) {
        span.setAttribute('message.content', data as string);
        span.setAttribute('message.length', (data as string).length);
      } else {
        span.setAttribute('data.json', JSON.stringify(data));
        span.setAttribute('data.type', typeof data);
      }

      // Add event to mark processing start
      span.addEvent('processing-started', {
        timestamp: Date.now(),
        hasData: data !== null,
        dataType: typeof data
      });

      // Simulate some processing work
      await new Promise(resolve => setTimeout(resolve, 100));

      // Process the data
      const result = {
        message: 'Event processed and traced',
        data,
        traced: true
      };

      span.addEvent('processing-completed', result);

      // Set status to OK
      span.setStatus({ code: SpanStatusCode.OK });

      return result;

    } catch (error) {
      // Record exception and set error status
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      ctx.logger.error('Error running agent', { error });
      throw error;
    } finally {
      span.end();
    }
  }
});
