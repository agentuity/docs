from agentuity import AgentRequest, AgentResponse, AgentContext
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, Literal
from datetime import datetime


class UserPreferences(BaseModel):
    language: Literal["en", "es", "fr"]
    max_results: int = Field(ge=1, le=50)


class UserQuery(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    user_id: str
    preferences: Optional[UserPreferences] = None


async def run(request: AgentRequest, response: AgentResponse, ctx: AgentContext):
    """Validates incoming requests with Pydantic schemas."""
    ctx.logger.info("Validating incoming request")

    try:
        raw_data = await request.data.json()
        # Validate with Pydantic
        validated = UserQuery(**raw_data)
    except ValidationError as e:
        ctx.logger.warning("Request validation failed", {"errors": e.errors()})
        return response.json(
            {"error": "Invalid request", "details": e.errors()}, status=400
        )

    # Use validated data (type-safe)
    ctx.logger.info(
        "Request validated successfully",
        {
            "userId": validated.user_id,
            "queryLength": len(validated.query),
            "hasPreferences": validated.preferences is not None,
        },
    )

    # Process with confidence that data is valid
    result = {
        "message": "Query processed successfully",
        "query": validated.query,
        "userId": validated.user_id,
        "preferences": (
            validated.preferences.model_dump()
            if validated.preferences
            else {"language": "en", "maxResults": 10}
        ),
        "processedAt": datetime.now().isoformat(),
    }

    return response.json(result)
