import { createAgent } from '@agentuity/runtime';

export default createAgent('child-logger-demo', {
  handler: async (ctx, input) => {
    const data = input as { userId?: string; requestId?: string; query?: string };
    const userId = data.userId || 'unknown';
    const requestId = data.requestId || ctx.runId;

    // Create child logger with context
    // All logs from this child logger will include these fields
    const logger = ctx.logger.child({
      requestId,
      userId
    });

    // Log processing start
    logger.info('Processing request started');

    // Simulate some processing steps
    logger.debug('Validating input data');

    if (!data.query) {
      logger.warn('Missing query field');
      return {
        message: 'Query is required',
        processedAt: new Date().toISOString()
      };
    }

    logger.debug('Processing query', { queryLength: data.query.length });

    // Simulate successful processing
    const result = {
      message: 'Request processed successfully',
      query: data.query,
      processedAt: new Date().toISOString()
    };

    logger.info('Processing completed successfully');

    return result;
  }
});
