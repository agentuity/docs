import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

// Define schema for user preferences
const UserPreferencesSchema = z.object({
  language: z.enum(['en', 'es', 'fr']),
  maxResults: z.number().int().min(1).max(50)
});

// Define schema for user query
const UserQuerySchema = z.object({
  query: z.string().min(1).max(500),
  userId: z.string(),
  preferences: UserPreferencesSchema.optional()
});

type UserQuery = z.infer<typeof UserQuerySchema>;

export default createAgent('input-validator', {
  handler: async (ctx, input) => {
    // Validate input with Zod
    const parseResult = UserQuerySchema.safeParse(input);
    if (!parseResult.success) {
      ctx.logger.warn('Request validation failed', {
        errors: parseResult.error.errors
      });
      throw new Error('Invalid request: ' + parseResult.error.message);
    }

    const { query, userId, preferences } = parseResult.data;

    ctx.logger.info('Request validated successfully', {
      userId,
      queryLength: query.length,
      hasPreferences: !!preferences
    });

    // Process with confidence that data is valid
    return {
      message: 'Query processed successfully',
      query,
      userId,
      preferences: preferences || { language: 'en', maxResults: 10 },
      processedAt: new Date().toISOString()
    };
  }
});
