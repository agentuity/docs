from agentuity import AgentRequest, AgentResponse, AgentContext
import asyncio

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get the search query from the request
    data = await request.data.json()
    query = data.get('query')

    context.logger.info('Getting multiple specialist agents')

    # Get references to multiple specialist agents
    web_agent = await context.get_agent({"name": "web-search"})
    news_agent = await context.get_agent({"name": "news-search"})

    context.logger.info('Running searches in parallel')

    # Execute both searches in parallel
    web_result, news_result = await asyncio.gather(
        web_agent.run({"query": query, "source": "web"}),
        news_agent.run({"query": query, "source": "news"})
    )

    # Process results from both agents
    web_data = await web_result.data.json()
    news_data = await news_result.data.json()

    # Return combined results
    return response.json({
        "query": query,
        "webResults": web_data,
        "newsResults": news_data,
        "totalSources": 2
    })

def welcome():
    import json
    return {
        'welcome': 'Execute multiple agents in parallel using asyncio.gather() for faster results.',
        'prompts': [
            {'data': json.dumps({'query': 'artificial intelligence'}), 'contentType': 'application/json'},
            {'data': json.dumps({'query': 'cloud computing'}), 'contentType': 'application/json'}
        ]
    }
