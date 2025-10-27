from agentuity import AgentRequest, AgentResponse, AgentContext

def welcome():
    return {
        'welcome': 'Perform semantic search using vector storage to find relevant facts.',
        'prompts': [
            {'data': 'What is Agentuity?', 'contentType': 'text/plain'},
            {'data': 'Tell me about vector storage', 'contentType': 'text/plain'},
            {'data': 'How does semantic search work?', 'contentType': 'text/plain'}
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    bucket = 'demo-knowledge'
    user_input = await request.data.text()

    # Sample facts to store
    facts = [
        {
            'key': 'fact-1',
            'document': 'Agentuity is an agent-native cloud platform designed for AI agents',
            'metadata': {'category': 'platform', 'topic': 'overview'}
        },
        {
            'key': 'fact-2',
            'document': 'Vector storage enables semantic search by meaning, not keywords',
            'metadata': {'category': 'features', 'topic': 'storage'}
        },
        {
            'key': 'fact-3',
            'document': 'Key-value storage is perfect for session state and caching',
            'metadata': {'category': 'features', 'topic': 'storage'}
        }
    ]

    # Upsert facts into vector storage
    # Python: Pass array of documents
    await context.vector.upsert(bucket, facts)

    context.logger.info(f'Upserted {len(facts)} facts to vector storage')

    # Search for relevant facts using semantic similarity
    search_results = await context.vector.search(
        bucket,
        query=user_input,
        limit=3,
        similarity=0.5  # Minimum similarity threshold (0-1)
    )

    context.logger.info(f'Found {len(search_results)} results')

    # Handle empty results
    if len(search_results) == 0:
        return response.json({
            'message': 'No relevant facts found',
            'query': user_input,
            'trySearching': "Try: 'What is Agentuity?' or 'How does vector storage work?'"
        })

    # Format results with similarity scores
    # Note: Search results don't include the document text by default
    # Store important text in metadata if you need to retrieve it
    formatted_results = [
        {
            'id': result.id,
            'key': result.key,
            'category': result.metadata.get('category') if result.metadata else None,
            'similarity': f'{result.similarity:.2f}'
        }
        for result in search_results
    ]

    # Cleanup demo data
    for fact in facts:
        await context.vector.delete(bucket, fact['key'])

    context.logger.info('Cleaned up demo data')

    return response.json({
        'query': user_input,
        'resultsFound': len(search_results),
        'results': formatted_results
    })
