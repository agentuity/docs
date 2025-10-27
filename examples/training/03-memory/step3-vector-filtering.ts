import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const bucket = 'demo-products';
  const data = await request.data.json();
  const { query, category, inStock } = data;

  // Sample product data
  const products = [
    {
      key: 'prod-1',
      document: 'Ergonomic office chair with lumbar support',
      metadata: { category: 'furniture', price: 299, inStock: true }
    },
    {
      key: 'prod-2',
      document: 'Standing desk with adjustable height',
      metadata: { category: 'furniture', price: 499, inStock: false }
    },
    {
      key: 'prod-3',
      document: 'Wireless keyboard and mouse combo',
      metadata: { category: 'electronics', price: 79, inStock: true }
    },
    {
      key: 'prod-4',
      document: 'LED desk lamp with USB charging',
      metadata: { category: 'electronics', price: 45, inStock: true }
    }
  ];

  // Upsert products
  for (const product of products) {
    await context.vector.upsert(bucket, product);
  }

  context.logger.info(`Upserted ${products.length} products`);

  // Build metadata filters
  const metadataFilters: Record<string, any> = {};
  if (category) {
    metadataFilters.category = category;
  }
  if (inStock !== undefined) {
    metadataFilters.inStock = inStock;
  }

  // Search with semantic similarity + metadata filters
  const searchResults = await context.vector.search(bucket, {
    query: query || 'office furniture',
    limit: 10,
    similarity: 0.3, // Lower threshold for broader matches
    metadata: metadataFilters
  });

  context.logger.info(
    `Found ${searchResults.length} results matching filters: ${JSON.stringify(metadataFilters)}`
  );

  // Format results
  const formattedResults = searchResults.map(result => ({
    id: result.id,
    key: result.key,
    category: result.metadata?.category,
    price: result.metadata?.price,
    inStock: result.metadata?.inStock,
    similarity: result.similarity.toFixed(2)
  }));

  // Cleanup demo data
  for (const product of products) {
    await context.vector.delete(bucket, product.key);
  }

  return response.json({
    query: query || 'office furniture',
    filters: metadataFilters,
    resultsFound: searchResults.length,
    results: formattedResults
  });
}

export const welcome = () => ({
  welcome: 'Search with semantic similarity + metadata filters (category, price, availability).',
  prompts: [
    { data: JSON.stringify({ query: 'desk furniture' }), contentType: 'application/json' },
    { data: JSON.stringify({ query: 'office setup', category: 'furniture' }), contentType: 'application/json' },
    { data: JSON.stringify({ query: 'electronics', inStock: true }), contentType: 'application/json' }
  ]
});
