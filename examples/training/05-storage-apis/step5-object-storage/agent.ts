import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

const agent = createAgent({
  schema: {
    input: z.object({
      content: z.string(),
      filename: z.string().optional()
    }),
    output: z.object({
      message: z.string(),
      filename: z.string(),
      contentLength: z.number(),
      publicUrl: z.string(),
      urlExpiresIn: z.string()
    })
  },
  metadata: {
    name: 'Object Storage Agent',
    description: 'Demonstrates object storage for files and binary data'
  },
  handler: async (c, input) => {
    const bucket = 'demo-files';
    const filename = input.filename || `file-${Date.now()}.txt`;

    // Store content as text file
    await c.objectstore.put(bucket, filename, input.content);

    c.logger.info('File stored in object storage', {
      bucket,
      filename,
      size: input.content.length
    });

    // Retrieve the stored file
    const result = await c.objectstore.get(bucket, filename);

    if (!result.exists) {
      throw new Error('File not found after upload');
    }

    const retrievedContent = await result.data.text();

    c.logger.info('File retrieved from object storage', {
      filename,
      contentLength: retrievedContent.length
    });

    // Create temporary public URL (expires in 1 hour)
    const publicUrl = await c.objectstore.createPublicURL(
      bucket,
      filename,
      3600000 // 1 hour in milliseconds
    );

    c.logger.info('Created public URL', {
      filename,
      url: publicUrl,
      expiresIn: '1 hour'
    });

    // Cleanup - delete demo file
    await c.objectstore.delete(bucket, filename);

    c.logger.info('Cleaned up demo file', { filename });

    return {
      message: 'File stored, retrieved, and public URL created',
      filename,
      contentLength: retrievedContent.length,
      publicUrl,
      urlExpiresIn: '1 hour'
    };
  }
});

export default agent;
