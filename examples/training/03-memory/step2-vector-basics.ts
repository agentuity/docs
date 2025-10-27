import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const bucket = 'demo-knowledge';
  const userInput = await request.data.text();

  // Sample facts to store
  const facts = [
    {
      key: 'fact-1',
      document: 'Agentuity is an agent-native cloud platform designed for AI agents',
      metadata: { category: 'platform', topic: 'overview' }
    },
    {
      key: 'fact-2',
      document: 'Vector storage enables semantic search by meaning, not keywords',
      metadata: { category: 'features', topic: 'storage' }
    },
    {
      key: 'fact-3',
      document: 'Key-value storage is perfect for session state and caching',
      metadata: { category: 'features', topic: 'storage' }
    }
  ];

  // Upsert facts into vector storage
  // TypeScript: Pass individual objects (not an array)
  for (const fact of facts) {
    await context.vector.upsert(bucket, fact);
  }

  context.logger.info(`Upserted ${facts.length} facts to vector storage`);

  // Search for relevant facts using semantic similarity
  const searchResults = await context.vector.search(bucket, {
    query: userInput,
    limit: 3,
    similarity: 0.5 // Minimum similarity threshold (0-1)
  });

  context.logger.info(`Found ${searchResults.length} results`);

  // Handle empty results
  if (searchResults.length === 0) {
    return response.json({
      message: 'No relevant facts found',
      query: userInput,
      trySearching: 'Try: "What is Agentuity?" or "How does vector storage work?"'
    });
  }

  // Format results with similarity scores
  // Note: Search results don't include the document text by default
  // Store important text in metadata if you need to retrieve it
  const formattedResults = searchResults.map(result => ({
    id: result.id,
    key: result.key,
    category: result.metadata?.category,
    similarity: result.similarity.toFixed(2)
  }));

  // Cleanup demo data
  for (const fact of facts) {
    await context.vector.delete(bucket, fact.key);
  }

  context.logger.info('Cleaned up demo data');

  return response.json({
    query: userInput,
    resultsFound: searchResults.length,
    results: formattedResults
  });
}

export const welcome = () => ({
  welcome: 'Perform semantic search using vector storage to find relevant facts.',
  prompts: [
    { data: 'What is Agentuity?', contentType: 'text/plain' },
    { data: 'Tell me about vector storage', contentType: 'text/plain' },
    { data: 'How does semantic search work?', contentType: 'text/plain' }
  ]
});
