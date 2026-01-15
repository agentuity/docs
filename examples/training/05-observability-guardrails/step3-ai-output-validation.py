from agentuity import AgentRequest, AgentResponse, AgentContext
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
from anthropic import AsyncAnthropic
import json


class SentimentAnalysis(BaseModel):
    sentiment: Literal["positive", "negative", "neutral"]
    confidence: float = Field(ge=0.0, le=1.0)
    summary: str


async def run(request: AgentRequest, response: AgentResponse, ctx: AgentContext):
    """Validates AI-generated output with Pydantic schemas."""
    data = await request.data.json()
    user_query = data.get("query", "This is a great product!")

    ctx.logger.info("Generating AI analysis", {"queryLength": len(user_query)})

    try:
        # Use Anthropic SDK for structured output
        client = AsyncAnthropic()
        ai_response = await client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1000,
            messages=[
                {
                    "role": "user",
                    "content": f"""Analyze the sentiment of this text: "{user_query}"

Respond with JSON containing:
- sentiment: "positive", "negative", or "neutral"
- confidence: a number between 0 and 1
- summary: a brief explanation (1-2 sentences)""",
                }
            ],
        )

        # Parse and validate with Pydantic
        response_text = ai_response.content[0].text
        analysis_data = json.loads(response_text)
        analysis = SentimentAnalysis(**analysis_data)

        ctx.logger.info(
            "Analysis complete",
            {"sentiment": analysis.sentiment, "confidence": analysis.confidence},
        )

        return response.json(
            {
                "query": user_query,
                "analysis": analysis.model_dump(),
                "generatedAt": datetime.now().isoformat(),
            }
        )

    except Exception as e:
        ctx.logger.error("AI generation failed", {"error": str(e)})
        return response.json({"error": "AI generation failed"}, status=500)
