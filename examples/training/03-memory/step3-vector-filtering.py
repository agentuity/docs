from agentuity import AgentRequest, AgentResponse, AgentContext
import json

def welcome():
    return {
        'welcome': 'Search with semantic similarity + metadata filters (category, price, availability).',
        'prompts': [
            {'data': json.dumps({'query': 'desk furniture'}), 'contentType': 'application/json'},
            {'data': json.dumps({'query': 'office setup', 'category': 'furniture'}), 'contentType': 'application/json'},
            {'data': json.dumps({'query': 'electronics', 'inStock': True}), 'contentType': 'application/json'}
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    bucket = 'demo-products'
    data = await request.data.json()
    query = data.get('query')
    category = data.get('category')
    in_stock = data.get('inStock')

    # Sample product data
    products = [
        {
            'key': 'prod-1',
            'document': 'Ergonomic office chair with lumbar support',
            'metadata': {'category': 'furniture', 'price': 299, 'inStock': True}
        },
        {
            'key': 'prod-2',
            'document': 'Standing desk with adjustable height',
            'metadata': {'category': 'furniture', 'price': 499, 'inStock': False}
        },
        {
            'key': 'prod-3',
            'document': 'Wireless keyboard and mouse combo',
            'metadata': {'category': 'electronics', 'price': 79, 'inStock': True}
        },
        {
            'key': 'prod-4',
            'document': 'LED desk lamp with USB charging',
            'metadata': {'category': 'electronics', 'price': 45, 'inStock': True}
        }
    ]

    # Upsert products
    await context.vector.upsert(bucket, products)

    context.logger.info(f'Upserted {len(products)} products')

    # Build metadata filters
    metadata_filters = {}
    if category:
        metadata_filters['category'] = category
    if in_stock is not None:
        metadata_filters['inStock'] = in_stock

    # Search with semantic similarity + metadata filters
    search_results = await context.vector.search(
        bucket,
        query=query or 'office furniture',
        limit=10,
        similarity=0.3,  # Lower threshold for broader matches
        metadata=metadata_filters
    )

    context.logger.info(
        f"Found {len(search_results)} results matching filters: {metadata_filters}"
    )

    # Format results
    formatted_results = [
        {
            'id': result.id,
            'key': result.key,
            'category': result.metadata.get('category') if result.metadata else None,
            'price': result.metadata.get('price') if result.metadata else None,
            'inStock': result.metadata.get('inStock') if result.metadata else None,
            'similarity': f'{result.similarity:.2f}'
        }
        for result in search_results
    ]

    # Cleanup demo data
    for product in products:
        await context.vector.delete(bucket, product['key'])

    return response.json({
        'query': query or 'office furniture',
        'filters': metadata_filters,
        'resultsFound': len(search_results),
        'results': formatted_results
    })
