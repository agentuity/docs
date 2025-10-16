import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Get request data
  const data = await request.data.json();
  const userId = data.userId || 'unknown';
  const requestId = data.requestId || context.runId;

  // Create child logger with context
  // All logs from this child logger will include these fields
  const requestLogger = context.logger.child({
    requestId,
    userId
  });

  // Log processing start
  requestLogger.info('Processing request started');

  try {
    // Simulate some processing steps
    requestLogger.debug('Validating input data');

    if (!data.query) {
      requestLogger.warn('Missing query field');
      return response.json({ error: 'Query is required' });
    }

    requestLogger.debug('Processing query', { queryLength: data.query.length });

    // Simulate successful processing
    const result = {
      message: 'Request processed successfully',
      query: data.query,
      processedAt: new Date().toISOString()
    };

    requestLogger.info('Processing completed successfully');

    return response.json(result);

  } catch (error) {
    // Error logs also include the child logger context
    requestLogger.error('Processing failed', error);
    return response.json({ error: 'Processing failed' }, { status: 500 });
  }
}
