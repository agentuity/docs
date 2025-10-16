from agentuity import AgentRequest, AgentResponse, AgentContext
import time
from aiohttp.web import Response

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    bucket = "demo-files"
    key = f"file-{int(time.time() * 1000)}.txt"

    try:
        user_input = await request.data.text()

        # Store text content (auto-detect content type)
        await context.objectstore.put(bucket, key, user_input)

        context.logger.info(f"Stored file: {key}")

        # Retrieve the stored content
        result = await context.objectstore.get(bucket, key)

        if not result.exists:
            context.logger.error("File not found after upload")
            return Response(text="Internal Server Error", status=500)

        content = await result.data.text()
        context.logger.info(f"Retrieved file content ({len(content)} characters)")

        # Create a temporary public URL (expires in 1 hour)
        public_url = await context.objectstore.create_public_url(
            bucket,
            key,
            3600000  # 1 hour in milliseconds
        )

        context.logger.info("Created public URL (expires in 1 hour)")

        # Cleanup - delete the demo file
        await context.objectstore.delete(bucket, key)

        context.logger.info("Cleaned up demo file")

        return response.json({
            "message": "File stored and retrieved successfully",
            "filename": key,
            "contentLength": len(content),
            "publicUrl": public_url,
            "urlExpiresIn": "1 hour",
            "note": "File was deleted after creating URL (demo cleanup)"
        })

    except Exception as error:
        context.logger.error(f"Error with object storage: {error}")
        return Response(text="Internal Server Error", status=500)
