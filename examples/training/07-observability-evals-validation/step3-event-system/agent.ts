import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      query: z.string()
    }),
    output: z.object({
      result: z.string(),
      processingTime: z.number()
    })
  },
  metadata: {
    name: 'Data Processor',
    description: 'Processes queries with performance tracking'
  },
  handler: async (c, input) => {
    const startTime = c.state.get('startTime') as number;

    c.logger.info('Processing query', { query: input.query });

    // Simulate some processing work
    await new Promise(resolve => setTimeout(resolve, 100));

    const processingTime = Date.now() - startTime;

    return {
      result: `Processed: ${input.query}`,
      processingTime
    };
  }
});

// Track when agent execution starts
agent.addEventListener('started', (eventName, agent, c) => {
  c.state.set('startTime', Date.now());

  c.logger.info('Agent execution started', {
    agentName: agent.metadata.name,
    sessionId: c.sessionId
  });
});

// Track successful completion and check performance
agent.addEventListener('completed', (eventName, agent, c) => {
  const startTime = c.state.get('startTime') as number;
  const duration = Date.now() - startTime;

  c.logger.info('Agent execution completed', {
    agentName: agent.metadata.name,
    duration,
    sessionId: c.sessionId
  });

  // Warn about slow executions
  if (duration > 200) {
    c.logger.warn('Slow execution detected', {
      duration,
      threshold: 200,
      agentName: agent.metadata.name
    });
  }
});

// Track errors
agent.addEventListener('errored', (eventName, agent, c, error) => {
  c.logger.error('Agent execution failed', {
    agentName: agent.metadata.name,
    error: error.message,
    sessionId: c.sessionId
  });
});
