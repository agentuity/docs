import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  // Get the search query from the request
  const { query } = await request.data.json();

  context.logger.info('Getting multiple specialist agents');

  // Get references to multiple specialist agents
  const webAgent = await context.getAgent({ name: 'web-search' });
  const newsAgent = await context.getAgent({ name: 'news-search' });

  context.logger.info('Running searches in parallel');

  // Execute both searches in parallel
  const [webResult, newsResult] = await Promise.all([
    webAgent.run({ data: { query, source: 'web' } }),
    newsAgent.run({ data: { query, source: 'news' } })
  ]);

  // Process results from both agents
  const webData = await webResult.data.json();
  const newsData = await newsResult.data.json();

  // Return combined results
  return response.json({
    query,
    webResults: webData,
    newsResults: newsData,
    totalSources: 2
  });
}

export const welcome = () => ({
  welcome: 'Execute multiple agents in parallel using Promise.all() for faster results.',
  prompts: [
    { data: JSON.stringify({ query: 'artificial intelligence' }), contentType: 'application/json' },
    { data: JSON.stringify({ query: 'cloud computing' }), contentType: 'application/json' }
  ]
});
