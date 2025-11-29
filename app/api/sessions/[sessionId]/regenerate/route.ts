import { type NextRequest, NextResponse } from 'next/server';
import { sessionService, agentService } from '@/lib/services';
import { createAgentStreamProcessor } from '@/lib/streaming/agent-stream-processor';

/**
 * Send SSE event helper
 */
function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * POST /api/sessions/[sessionId]/regenerate
 *
 * Regenerates the assistant response for a session.
 * - If last message is ASSISTANT: removes it and generates new response
 * - If last message is USER: generates assistant response (agent never responded)
 *
 * Streams SSE events:
 * - start: { action: 'replace' | 'new', messageId: string }
 * - text-delta: { textDelta: string }
 * - tutorial-data: { tutorialData: TutorialData }
 * - documentation-references: { documents: string[] }
 * - finish: { session: Session }
 * - error: { error: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = request.cookies.get('chat_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { sessionId } = await params;

    // Get session
    let session = await sessionService.getSession(userId, sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.recentMessages.length === 0) {
      return NextResponse.json({ error: 'No messages to regenerate' }, { status: 400 });
    }

    // Determine action based on last message
    const lastMessage = session.recentMessages[session.recentMessages.length - 1];
    const action: 'replace' | 'new' = lastMessage.role === 'ASSISTANT' ? 'replace' : 'new';

    // Generate new message ID
    const assistantMessageId = crypto.randomUUID();

    // If replacing, find the message ID we're replacing and remove it
    let replacedMessageId: string | undefined;
    if (action === 'replace') {
      replacedMessageId = lastMessage.id;
      await sessionService.removeLastAssistantMessage(userId, sessionId);

      // Refetch session after removal
      session = await sessionService.getSession(userId, sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Session not found after removal' }, { status: 500 });
      }
    }

    // Find the user message to respond to
    const userMessage = session.recentMessages
      .filter(m => m.role === 'USER')
      .pop();

    if (!userMessage) {
      return NextResponse.json({ error: 'No user message found' }, { status: 400 });
    }

    // Get current tutorial state
    const { TutorialStateManager } = await import('@/lib/tutorial/state-manager');
    const currentTutorialState = await TutorialStateManager.getCurrentTutorialState(userId);

    // Build conversation history (excludes the removed assistant message)
    const conversationHistory = session.recentMessages.map((msg) => ({
      id: msg.id,
      author: msg.role as 'USER' | 'ASSISTANT',
      content: msg.content,
      timestamp: msg.timestamp,
      tutorialData: msg.tutorialData,
      documentationReferences: msg.documentationReferences,
    }));

    // Get agent response stream
    const agentResponse = await agentService.streamResponse({
      message: userMessage.content,
      conversationHistory,
      tutorialData: currentTutorialState,
      userId,
    });

    if (!agentResponse.body) {
      throw new Error('No response body from agent');
    }

    // Create transform stream with shared processor
    const transformStream = await createAgentStreamProcessor({
      userId,
      sessionId,
      assistantMessageId,
      onStart: async (controller) => {
        // Send start event with action and message ID
        // For 'replace', send the original message ID so frontend knows which to update
        controller.enqueue(
          new TextEncoder().encode(
            sseEvent({
              type: 'start',
              action,
              messageId: action === 'replace' ? replacedMessageId : assistantMessageId,
            })
          )
        );
      },
    });

    // Pipe agent response through transform stream
    const reader = agentResponse.body.getReader();
    const writer = transformStream.writable.getWriter();

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          await writer.write(value);
        }
        await writer.close();
      } catch (error) {
        console.error('[RegenerateRoute] Stream error:', error);
        writer.abort(error);
      }
    })();

    return new NextResponse(transformStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[RegenerateRoute] Error:', error);
    return NextResponse.json(
      { error: 'Unable to regenerate response. Please try again.' },
      { status: 500 }
    );
  }
}
