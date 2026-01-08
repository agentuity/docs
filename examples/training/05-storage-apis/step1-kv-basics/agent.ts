import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

const agent = createAgent({
  schema: {
    input: z.object({
      query: z.string()
    }),
    output: z.object({
      result: z.string(),
      cached: z.boolean(),
      cacheKey: z.string()
    })
  },
  metadata: {
    name: 'KV Basics Agent',
    description: 'Demonstrates KV storage with TTL for caching'
  },
  handler: async (c, input) => {
    const bucket = 'api-cache';
    const cacheKey = `query:${input.query.toLowerCase().replace(/\s+/g, '-')}`;

    // Check cache first
    const cached = await c.kv.get(bucket, cacheKey);

    if (cached.exists) {
      // Cache hit - return immediately
      const data = cached.data as string;

      c.logger.info('Cache hit', {
        cacheKey,
        query: input.query
      });

      return {
        result: data,
        cached: true,
        cacheKey
      };
    }

    // Cache miss - simulate expensive computation
    c.logger.info('Cache miss - computing result', {
      cacheKey,
      query: input.query
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    const result = `Computed result for: ${input.query}`;

    // Store in cache with 5-minute TTL
    await c.kv.set(bucket, cacheKey, result, {
      ttl: 300 // 5 minutes in seconds
    });

    c.logger.info('Result cached with 5-minute TTL', {
      cacheKey
    });

    return {
      result,
      cached: false,
      cacheKey
    };
  }
});

export default agent;
