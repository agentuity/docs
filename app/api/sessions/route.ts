import { NextRequest, NextResponse } from 'next/server';
import { Session, SessionSchema } from '@/app/chat/types';
import { parseAndValidateJSON } from '@/lib/validation/middleware';
import { sessionService } from '@/lib/services';
import type { Session as NewSession } from '@/lib/storage/data-model';

// Constants
const DEFAULT_SESSIONS_LIMIT = 10;
const MAX_SESSIONS_LIMIT = 50;

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
 * GET /api/sessions - Get all sessions (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('chat_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parsedLimit = Number.parseInt(searchParams.get('limit') ?? String(DEFAULT_SESSIONS_LIMIT));
    const parsedCursor = Number.parseInt(searchParams.get('cursor') ?? '0');

    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), MAX_SESSIONS_LIMIT) : DEFAULT_SESSIONS_LIMIT;
    const cursor = Number.isFinite(parsedCursor) ? Math.max(parsedCursor, 0) : 0;

    // Use SessionService to list sessions
    const result = await sessionService.listSessions(userId, {
      limit,
      offset: cursor,
      status: 'ACTIVE',
    });

    // Convert to old session format
    const sessions = result.sessions.map(toOldSession);

    const nextCursor = result.hasMore ? cursor + limit : null;

    return NextResponse.json({
      sessions,
      pagination: {
        cursor,
        nextCursor,
        hasMore: result.hasMore,
        total: result.total,
        limit,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions - Create a new session
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('chat_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const validation = await parseAndValidateJSON(request, SessionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const oldSession = validation.data;

    // IMPORTANT: Use client-provided sessionId, not generate a new one
    // Frontend creates the sessionId and needs it to match
    const newSession = await sessionService.createSessionWithId({
      userId,
      sessionId: oldSession.sessionId, // Use client's sessionId!
      title: oldSession.title,
      isTutorial: oldSession.isTutorial ?? false,
    });

    // Convert back to old format for API response
    const session = toOldSession(newSession);

    return NextResponse.json({
      success: true,
      session,
      ...(session.title ? {} : { titleGeneration: 'pending' }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
