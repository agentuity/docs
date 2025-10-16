from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime
from aiohttp.web import Response

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    bucket = "user-profiles"
    user_id = "user-123"  # In production, get from request.metadata

    try:
        # Get user input (preference to update)
        data = await request.data.json()
        theme = data.get("theme")
        language = data.get("language")

        # Retrieve existing user profile
        result = await context.kv.get(bucket, user_id)

        if result.exists:
            # Existing user - load and update profile
            profile = await result.data.json()
            profile["lastSeen"] = datetime.now().isoformat()
            profile["interactionCount"] = profile.get("interactionCount", 0) + 1

            context.logger.info(f"Updating profile for returning user ({profile['interactionCount']} interactions)")
        else:
            # New user - create profile
            profile = {
                "userId": user_id,
                "preferences": {},
                "created": datetime.now().isoformat(),
                "interactionCount": 1
            }

            context.logger.info("Creating new user profile")

        # Update preferences if provided
        if theme:
            profile["preferences"]["theme"] = theme
        if language:
            profile["preferences"]["language"] = language

        # Save profile WITHOUT TTL (permanent storage)
        await context.kv.set(bucket, user_id, profile)

        context.logger.info("Saved user profile (permanent storage)")

        # Return updated profile
        return response.json({
            "message": "Profile updated successfully",
            "profile": profile,
            "storage": "permanent (no TTL)"
        })

    except Exception as error:
        context.logger.error(f"Error managing user profile: {error}")
        return Response(text="Internal Server Error", status=500)
