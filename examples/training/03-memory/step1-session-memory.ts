import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

// Define a simple message type for session memory
type SessionMessage = {
  role: string;
  content: string;
  timestamp: string;
};

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const bucket = 'demo-sessions';
  const key = 'chat-history';

  // Initialize with proper type
  let messages: SessionMessage[] = [];

  // Retrieve existing session data
  try {
    const result = await context.kv.get(bucket, key);

    if (result.exists) {
      // Cast to our type
      messages = await result.data.json() as SessionMessage[];
      context.logger.info(`Loaded ${messages.length} existing messages`);
    } else {
      context.logger.info('Starting new session');
    }
  } catch (error) {
    context.logger.error('Error retrieving session:', error);
    // Continue with empty array if retrieval fails
  }

  // Get user message
  const userMessage = await request.data.text();

  // Add the new user message
  messages.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  });

  // Save conversation with 1-hour TTL (automatic expiration)
  // Note: Omit the ttl parameter for permanent storage
  await context.kv.set(bucket, key, messages, {
    ttl: 3600 // 1 hour in seconds
  });

  context.logger.info(`Saved ${messages.length} messages with 1-hour TTL`);

  // Return conversation summary
  return response.json({
    message: 'Message saved to session memory',
    messageCount: messages.length,
    expiresIn: '1 hour'
  });
}

export const welcome = () => ({
  welcome: 'Store conversation history in session memory with automatic TTL-based expiry.',
  prompts: [
    { data: 'Hello, this is my first message', contentType: 'text/plain' },
    { data: 'Here is my second message', contentType: 'text/plain' },
    { data: 'And a third message', contentType: 'text/plain' }
  ]
});
