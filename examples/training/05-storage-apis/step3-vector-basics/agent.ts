import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

const agent = createAgent({
  schema: {
    input: z.object({
      query: z.string()
    }),
    output: z.object({
      query: z.string(),
      resultsFound: z.number(),
      results: z.array(z.object({
        key: z.string(),
        similarity: z.number(),
        category: z.string().optional()
      }))
    })
  },
  metadata: {
    name: 'Vector Basics Agent',
    description: 'Demonstrates vector storage with variadic upsert pattern'
  },
  handler: async (c, input) => {
    const bucket = 'knowledge-base';

    // Sample knowledge base entries
    const facts = [
      {
        key: 'fact-1',
        document: 'Agentuity is an agent-native cloud platform designed for AI agents',
        metadata: { category: 'platform' }
      },
      {
        key: 'fact-2',
        document: 'Vector storage enables semantic search by meaning, not keywords',
        metadata: { category: 'features' }
      },
      {
        key: 'fact-3',
        document: 'Key-value storage is perfect for caching and session state',
        metadata: { category: 'features' }
      }
    ];

    // VARIADIC UPSERT PATTERN: Pass multiple documents at once
    // Option 1: Spread array (recommended for dynamic lists)
    await c.vector.upsert(bucket, ...facts);

    // Option 2: Individual parameters (good for static data)
    // await c.vector.upsert(
    //   bucket,
    //   { key: 'fact-1', document: '...', metadata: {...} },
    //   { key: 'fact-2', document: '...', metadata: {...} },
    //   { key: 'fact-3', document: '...', metadata: {...} }
    // );

    c.logger.info('Upserted documents to vector storage', {
      bucket,
      count: facts.length
    });

    // Search for semantically similar documents
    const searchResults = await c.vector.search(bucket, {
      query: input.query,
      limit: 3,
      similarity: 0.5
    });

    c.logger.info('Vector search completed', {
      query: input.query,
      resultsFound: searchResults.length
    });

    // Format results
    const results = searchResults.map(result => ({
      key: result.key,
      similarity: result.similarity,
      category: result.metadata?.category as string | undefined
    }));

    // Cleanup demo data
    for (const fact of facts) {
      await c.vector.delete(bucket, fact.key);
    }

    return {
      query: input.query,
      resultsFound: searchResults.length,
      results
    };
  }
});

export default agent;
