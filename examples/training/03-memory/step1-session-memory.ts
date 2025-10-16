import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const bucket = 'demo-sessions';
  const sessionId = context.sessionId; // Use the current session ID

  try {
    // Get the user's message
    const userMessage = await request.data.text();

    // Retrieve existing session data
    const result = await context.kv.get(bucket, sessionId);

    let messages;
    if (result.exists) {
      // Session exists - load conversation history
      messages = await result.data.json();
      context.logger.info(`Loaded ${messages.length} existing messages`);
    } else {
      // New session - initialize conversation
      messages = [];
      context.logger.info('Starting new session');
    }

    // Add the new user message
    messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    });

    // Save conversation with 1-hour TTL (automatic cleanup)
    await context.kv.set(bucket, sessionId, messages, {
      ttl: 3600 // 1 hour in seconds
    });

    context.logger.info(`Saved ${messages.length} messages with 1-hour TTL`);

    // Return conversation summary
    return response.json({
      message: 'Message saved to session memory',
      messageCount: messages.length,
      sessionId: sessionId,
      expiresIn: '1 hour'
    });

  } catch (error) {
    context.logger.error('Error managing session memory:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
