import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

const agent = createAgent({
  schema: {
    input: z.object({
      query: z.string(),
      category: z.string().optional(),
      inStock: z.boolean().optional()
    }),
    output: z.object({
      query: z.string(),
      filters: z.object({
        category: z.string().optional(),
        inStock: z.boolean().optional()
      }),
      resultsFound: z.number(),
      results: z.array(z.object({
        key: z.string(),
        similarity: z.number(),
        category: z.string(),
        price: z.number(),
        inStock: z.boolean()
      }))
    })
  },
  metadata: {
    name: 'Vector Filtering Agent',
    description: 'Demonstrates vector search with metadata filtering'
  },
  handler: async (c, input) => {
    const bucket = 'product-catalog';

    // Sample product catalog
    const products = [
      {
        key: 'chair-001',
        document: 'Ergonomic office chair with lumbar support',
        metadata: { category: 'furniture', price: 299, inStock: true }
      },
      {
        key: 'desk-001',
        document: 'Standing desk with adjustable height',
        metadata: { category: 'furniture', price: 599, inStock: true }
      },
      {
        key: 'laptop-001',
        document: 'High-performance laptop for development',
        metadata: { category: 'electronics', price: 1499, inStock: false }
      },
      {
        key: 'monitor-001',
        document: '4K monitor with USB-C connectivity',
        metadata: { category: 'electronics', price: 499, inStock: true }
      }
    ];

    // Upsert products using variadic pattern
    await c.vector.upsert(bucket, ...products);

    c.logger.info('Upserted products', {
      bucket,
      count: products.length
    });

    // Build metadata filters
    const metadataFilter: Record<string, any> = {};
    if (input.category) {
      metadataFilter.category = input.category;
    }
    if (input.inStock !== undefined) {
      metadataFilter.inStock = input.inStock;
    }

    // Search with metadata filtering
    const searchResults = await c.vector.search(bucket, {
      query: input.query,
      limit: 10,
      similarity: 0.3, // Lower threshold when using filters
      ...(Object.keys(metadataFilter).length > 0 && { metadata: metadataFilter })
    });

    c.logger.info('Vector search with filters completed', {
      query: input.query,
      filters: metadataFilter,
      resultsFound: searchResults.length
    });

    // Format results
    const results = searchResults.map(result => ({
      key: result.key,
      similarity: result.similarity,
      category: result.metadata?.category as string,
      price: result.metadata?.price as number,
      inStock: result.metadata?.inStock as boolean
    }));

    // Cleanup demo data
    for (const product of products) {
      await c.vector.delete(bucket, product.key);
    }

    return {
      query: input.query,
      filters: {
        category: input.category,
        inStock: input.inStock
      },
      resultsFound: searchResults.length,
      results
    };
  }
});

export default agent;
