import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const data = await request.data.json();
  const query = data.query || 'default';

  // Create a cache key
  const cacheKey = `query_${query.toLowerCase().replace(/\s+/g, '_')}`;

  context.logger.info('Checking cache', { cacheKey });

  // Check if we have cached data
  const cached = await context.kv.get('demo-cache', cacheKey);

  if (cached.exists) {
    const cachedData = await cached.data.json();
    context.logger.info('Cache hit!', { cacheKey });

    return response.json({
      source: 'cache',
      query,
      result: cachedData,
      message: 'Retrieved from cache'
    });
  }

  // Cache miss - simulate expensive operation
  context.logger.info('Cache miss - computing result', { cacheKey });

  const result = {
    query,
    computed: true,
    timestamp: new Date().toISOString(),
    data: `Processed: ${query}`
  };

  // Store in cache with 5 minute TTL
  await context.kv.set('demo-cache', cacheKey, result, { ttl: 300 });

  context.logger.info('Result cached', {
    cacheKey,
    ttl: '300s (5 minutes)'
  });

  return response.json({
    source: 'fresh',
    query,
    result,
    message: 'Computed and cached for 5 minutes'
  });
}
