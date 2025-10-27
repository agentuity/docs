import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const bucket = 'demo-files';
  const key = `file-${Date.now()}.txt`;

  try {
    const userInput = await request.data.text();

    // Store text content (auto-detect content type)
    await context.objectstore.put(bucket, key, userInput);

    context.logger.info(`Stored file: ${key}`);

    // Retrieve the stored content
    const result = await context.objectstore.get(bucket, key);

    if (!result.exists) {
      context.logger.error('File not found after upload');
      return new Response('Internal Server Error', { status: 500 });
    }

    const content = await result.data.text();
    context.logger.info(`Retrieved file content (${content.length} characters)`);

    // Create a temporary public URL (expires in 1 hour)
    const publicUrl = await context.objectstore.createPublicURL(
      bucket,
      key,
      3600000 // 1 hour in milliseconds
    );

    context.logger.info(`Created public URL (expires in 1 hour)`);

    // Cleanup - delete the demo file
    await context.objectstore.delete(bucket, key);

    context.logger.info('Cleaned up demo file');

    return response.json({
      message: 'File stored and retrieved successfully',
      filename: key,
      contentLength: content.length,
      publicUrl: publicUrl,
      urlExpiresIn: '1 hour',
      note: 'File was deleted after creating URL (demo cleanup)'
    });

  } catch (error) {
    context.logger.error('Error with object storage:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export const welcome = () => ({
  welcome: 'Store files in object storage and generate temporary public URLs.',
  prompts: [
    { data: 'This is a sample document content', contentType: 'text/plain' },
    { data: 'Another test file with different content', contentType: 'text/plain' }
  ]
});
