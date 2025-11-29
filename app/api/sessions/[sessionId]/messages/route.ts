import { type NextRequest, NextResponse } from 'next/server';
import { toISOString } from '@/app/chat/utils/dateUtils';
import { parseAndValidateJSON, SessionMessageRequestSchema } from '@/lib/validation/middleware';
import { sessionService, messageService, agentService } from '@/lib/services';
import { createAgentStreamProcessor } from '@/lib/streaming/agent-stream-processor';
import type { Session as NewSession } from '@/lib/storage/data-model';

/**
 * Convert new Session model to old Session model for API compatibility
 */
function toOldSession(newSession: NewSession) {
  return {
    sessionId: newSession.sessionId,
    isTutorial: newSession.isTutorial,
    title: newSession.title,
    messages: newSession.recentMessages.map((msg) => ({
      id: msg.id,
      author: msg.role as 'USER' | 'ASSISTANT',
      content: msg.content,
      timestamp: msg.timestamp,
      tutorialData: msg.tutorialData,
      documentationReferences: msg.documentationReferences,
    })),
  };
}

/**
 * POST /api/sessions/[sessionId]/messages - Add a message to a session and process with streaming
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

    const paramsData = await params;
    const sessionId = paramsData.sessionId;

    const validation = await parseAndValidateJSON(request, SessionMessageRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { message, processWithAgent } = validation.data;

    // Ensure timestamp is in ISO string format
    if (message.timestamp) {
      message.timestamp = toISOString(message.timestamp);
    }

    // Get session to verify it exists
    let session = await sessionService.getSession(userId, sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Add user message to session
    await messageService.addMessage({
      userId,
      sessionId,
      content: message.content,
      role: 'USER',
    });

    // Refetch session to get the updated version with user message
    session = await sessionService.getSession(userId, sessionId);
    if (!session) {
      console.error('[MessageRoute] Session not found after adding message!');
      return NextResponse.json({ error: 'Session not found after adding message' }, { status: 500 });
    }

    // If not processing with agent, return early
    if (!processWithAgent || message.author !== 'USER') {
      return NextResponse.json(
        { success: true, session: toOldSession(session) },
        { status: 200 }
      );
    }

    // Get current tutorial state
    const { TutorialStateManager } = await import('@/lib/tutorial/state-manager');
    const currentTutorialState = await TutorialStateManager.getCurrentTutorialState(userId);

    // Build conversation history from updated session (includes the new user message)
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
      message: message.content,
      conversationHistory,
      tutorialData: currentTutorialState,
      userId,
    });

    if (!agentResponse.body) {
      throw new Error('No response body from agent');
    }

    // Create transform stream with shared processor
    const assistantMessageId = crypto.randomUUID();
    const transformStream = await createAgentStreamProcessor({
      userId,
      sessionId,
      assistantMessageId,
    });

    // Pipe agent response through transform stream
    const agentReader = agentResponse.body.getReader();
    const writer = transformStream.writable.getWriter();

    (async () => {
      try {
        while (true) {
          const { done, value } = await agentReader.read();
          if (done) break;

          try {
            await writer.write(value);
          } catch (writeError) {
            console.error('[MessageRoute] Error writing to transform stream:', writeError);
            throw writeError;
          }
        }
        await writer.close();
      } catch (error) {
        console.error('[MessageRoute] Error in stream processing:', error);
        writer.abort(error);
      }
    })();

    return new NextResponse(transformStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[MessageRoute] Error in messages API:', error);
    if (error instanceof Error) {
      console.error('[MessageRoute] Error stack:', error.stack);
    }
    return new Response(
      JSON.stringify({
        error: 'Unable to process your message at this time. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
