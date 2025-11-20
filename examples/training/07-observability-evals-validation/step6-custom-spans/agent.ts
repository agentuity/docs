import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';
import { SpanStatusCode } from '@opentelemetry/api';

export const agent = createAgent({
  schema: {
    input: z.object({
      data: z.array(z.string())
    }),
    output: z.object({
      processed: z.number()
    })
  },
  metadata: {
    name: 'Data Pipeline',
    description: 'Processes data with custom span tracking'
  },
  handler: async (c, input) => {
    // Create parent span for entire pipeline
    return c.tracer.startActiveSpan('data-pipeline', async (parentSpan) => {
      try {
        parentSpan.setAttribute('input.size', input.data.length);
        parentSpan.setAttribute('pipeline.type', 'batch');

        // Step 1: Validation with child span
        const validated = await c.tracer.startActiveSpan(
          'validate-data',
          async (span) => {
            try {
              span.addEvent('validation-started');

              // Validate data (filter empty strings)
              const valid = input.data.filter(item => item.length > 0);

              span.addEvent('validation-completed', {
                validCount: valid.length,
                invalidCount: input.data.length - valid.length
              });

              span.setStatus({ code: SpanStatusCode.OK });
              return valid;
            } catch (error) {
              span.recordException(error as Error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: (error as Error).message
              });
              throw error;
            } finally {
              span.end();
            }
          }
        );

        // Step 2: Processing with child span
        const processed = await c.tracer.startActiveSpan(
          'process-data',
          async (span) => {
            try {
              span.addEvent('processing-started');

              // Process data (convert to uppercase)
              const result = validated.map(item => item.toUpperCase());

              span.addEvent('processing-completed', {
                count: result.length
              });

              span.setStatus({ code: SpanStatusCode.OK });
              return result;
            } catch (error) {
              span.recordException(error as Error);
              span.setStatus({ code: SpanStatusCode.ERROR });
              throw error;
            } finally {
              span.end();
            }
          }
        );

        parentSpan.setStatus({ code: SpanStatusCode.OK });

        return { processed: processed.length };
      } catch (error) {
        parentSpan.recordException(error as Error);
        parentSpan.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        parentSpan.end();
      }
    });
  }
});
