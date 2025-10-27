from agentuity import AgentRequest, AgentResponse, AgentContext
from pydantic import BaseModel, Field, ValidationError
from typing import Literal
from datetime import datetime
from aiohttp.web import Response
import json

# Define Pydantic model for AI-generated sentiment analysis
class SentimentAnalysis(BaseModel):
    sentiment: Literal['positive', 'negative', 'neutral']
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    # Get user query
    data = await request.data.json()
    user_query = data.get("query", "This is a great product!")

    context.logger.info(f"Generating AI analysis query_length={len(user_query)}")

    try:
        # Use Anthropic for structured generation
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic()

        ai_response = await client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=500,
            system="""You analyze sentiment of text. Respond with valid JSON matching this structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.0-1.0,
  "summary": "brief explanation"
}

Only respond with the JSON, no other text.""",
            messages=[{
                "role": "user",
                "content": f"Analyze the sentiment of this text: \"{user_query}\""
            }]
        )

        # Validate AI response with Pydantic
        try:
            response_text = ai_response.content[0].text
            analysis_data = json.loads(response_text)
            analysis = SentimentAnalysis(**analysis_data)

            context.logger.info(f"Analysis complete sentiment={analysis.sentiment} confidence={analysis.confidence}")

            return response.json({
                "query": user_query,
                "analysis": analysis.model_dump(),
                "generatedAt": datetime.now().isoformat()
            })

        except (json.JSONDecodeError, ValidationError) as e:
            context.logger.error(f"AI returned invalid data: {str(e)}")
            return Response(
                text=json.dumps({"error": "AI response validation failed"}),
                status=500,
                content_type='application/json'
            )

    except Exception as error:
        context.logger.error(f"AI generation failed: {str(error)}")
        return Response(
            text=json.dumps({"error": "AI generation failed"}),
            status=500,
            content_type='application/json'
        )
