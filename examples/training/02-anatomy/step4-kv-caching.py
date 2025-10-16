from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    data = await request.data.json()
    query = data.get("query", "default")

    # Create a cache key
    cache_key = f"query_{query.lower().replace(' ', '_')}"

    context.logger.info(f"Checking cache cache_key={cache_key}")

    # Check if we have cached data
    cached = await context.kv.get("demo-cache", cache_key)

    if cached.exists:
        cached_data = await cached.data.json()
        context.logger.info(f"Cache hit! cache_key={cache_key}")

        return response.json({
            "source": "cache",
            "query": query,
            "result": cached_data,
            "message": "Retrieved from cache"
        })

    # Cache miss - simulate expensive operation
    context.logger.info(f"Cache miss - computing result cache_key={cache_key}")

    result = {
        "query": query,
        "computed": True,
        "timestamp": datetime.now().isoformat(),
        "data": f"Processed: {query}"
    }

    # Store in cache with 5 minute TTL
    await context.kv.set("demo-cache", cache_key, result, {"ttl": 300})

    context.logger.info(f"Result cached cache_key={cache_key} ttl=300s (5 minutes)")

    return response.json({
        "source": "fresh",
        "query": query,
        "result": result,
        "message": "Computed and cached for 5 minutes"
    })
