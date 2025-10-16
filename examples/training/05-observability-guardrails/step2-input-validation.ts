import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { z } from "zod";

// Define schema for user preferences
const UserPreferencesSchema = z.object({
  language: z.enum(['en', 'es', 'fr']),
  maxResults: z.number().int().min(1).max(50)
}).optional();

// Define schema for user query
const UserQuerySchema = z.object({
  query: z.string().min(1).max(500),
  userId: z.string(),
  preferences: UserPreferencesSchema
});

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  context.logger.info('Validating incoming request');

  // Validate incoming request with Zod
  const result = UserQuerySchema.safeParse(await request.data.json());

  if (!result.success) {
    context.logger.warn('Request validation failed', {
      errors: result.error.issues
    });

    return response.json({
      error: 'Invalid request',
      details: result.error.issues
    }, { status: 400 });
  }

  // Use validated data (type-safe)
  const { query, userId, preferences } = result.data;

  context.logger.info('Request validated successfully', {
    userId,
    queryLength: query.length,
    hasPreferences: !!preferences
  });

  // Process with confidence that data is valid
  const processedResponse = {
    message: 'Query processed successfully',
    query,
    userId,
    preferences: preferences || { language: 'en', maxResults: 10 },
    processedAt: new Date().toISOString()
  };

  return response.json(processedResponse);
}
