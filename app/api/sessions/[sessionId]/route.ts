import { NextRequest, NextResponse } from 'next/server';
import { Session, Message, SessionSchema } from '@/app/chat/types';
import { toISOString } from '@/app/chat/utils/dateUtils';
import { parseAndValidateJSON, SessionMessageOnlyRequestSchema } from '@/lib/validation/middleware';
import { sessionService } from '@/lib/services';
import type { Session as NewSession, Message as NewMessage } from '@/lib/storage/data-model';

/**
 * Convert new Session model to old Session model for API compatibility
 */
function toOldSession(newSession: NewSession): Session {
  return {
    sessionId: newSession.sessionId,
    isTutorial: newSession.isTutorial,
    title: newSession.title,
    messages: newSession.recentMessages.map(msg => ({
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
 * GET /api/sessions/[sessionId] - Get a specific session
 */
export async function GET(
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

    const newSession = await sessionService.getSession(userId, sessionId);

    if (!newSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = toOldSession(newSession);

    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sessions/[sessionId] - Update a session
 */
export async function PUT(
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

    const validation = await parseAndValidateJSON(request, SessionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const oldSession = validation.data;

    if (oldSession.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Session ID mismatch' },
        { status: 400 }
      );
    }

    // Use SessionService to update session
    const updatedSession = await sessionService.updateSession(userId, sessionId, {
      title: oldSession.title,
    });

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = toOldSession(updatedSession);

    return NextResponse.json({ success: true, session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[sessionId] - Delete a session
 */
export async function DELETE(
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

    // Use SessionService to delete session
    await sessionService.deleteSession(userId, sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

