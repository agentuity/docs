from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    data = await request.data.json()
    format_type = data.get("format", "json")

    context.logger.info(f"Generating response format={format_type}")

    # Return different formats based on request
    if format_type == "json":
        return response.json({
            "type": "json",
            "message": "This is a JSON response",
            "data": {
                "agent": context.agent.name,
                "timestamp": datetime.now().isoformat()
            }
        })
    elif format_type == "text":
        return response.text("This is a plain text response from your agent.")
    elif format_type == "html":
        html = f"""
        <!DOCTYPE html>
        <html>
          <head><title>Agent Response</title></head>
          <body>
            <h1>HTML Response</h1>
            <p>This is an HTML response from your agent.</p>
            <p>Agent: {context.agent.name}</p>
          </body>
        </html>
        """
        return response.html(html)
    elif format_type == "empty":
        # Empty responses are useful for webhooks that don't need data back
        return response.empty()
    else:
        return response.json({
            "error": "Unknown format",
            "supportedFormats": ["json", "text", "html", "empty"],
            "requested": format_type
        })
