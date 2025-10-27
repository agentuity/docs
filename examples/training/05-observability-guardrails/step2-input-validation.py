from agentuity import AgentRequest, AgentResponse, AgentContext
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, Literal
from datetime import datetime
from aiohttp.web import Response
import json

# Define Pydantic model for user preferences
class UserPreferences(BaseModel):
    language: Literal['en', 'es', 'fr']
    max_results: int = Field(ge=1, le=50)

# Define Pydantic model for user query
class UserQuery(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    user_id: str
    preferences: Optional[UserPreferences] = None

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    context.logger.info("Validating incoming request")

    # Validate incoming request with Pydantic
    try:
        raw_data = await request.data.json()
        validated = UserQuery(**raw_data)
    except ValidationError as e:
        context.logger.warning(f"Request validation failed errors={e.error_count()}")

        return Response(
            text=json.dumps({
                "error": "Invalid request",
                "details": [{"field": err["loc"][-1], "message": err["msg"]}
                            for err in e.errors()]
            }),
            status=400,
            content_type='application/json'
        )

    # Use validated data (type-safe)
    query = validated.query
    user_id = validated.user_id
    preferences = validated.preferences

    context.logger.info(f"Request validated successfully user_id={user_id} query_length={len(query)} has_preferences={preferences is not None}")

    # Process with confidence that data is valid
    processed_response = {
        "message": "Query processed successfully",
        "query": query,
        "userId": user_id,
        "preferences": preferences.model_dump() if preferences else {"language": "en", "max_results": 10},
        "processedAt": datetime.now().isoformat()
    }

    return response.json(processed_response)
