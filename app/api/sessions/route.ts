import { NextRequest, NextResponse } from 'next/server';
import { getKVValue, setKVValue } from '@/lib/kv-store';
import { Session, Message, SessionSchema } from '@/app/chat/types';
import { toISOString } from '@/app/chat/utils/dateUtils';
import { config } from '@/lib/config';
import { parseAndValidateJSON } from '@/lib/validation/middleware';

// Constants
const DEFAULT_SESSIONS_LIMIT = 10;
const MAX_SESSIONS_LIMIT = 50;

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

    const response = await getKVValue<string[]>(userId, { storeName: config.defaultStoreName });
    if (!response.success) {
      if (response.statusCode === 404) {
        return NextResponse.json({ sessions: [], pagination: { cursor, nextCursor: null, hasMore: false, total: 0, limit } });
      }
      return NextResponse.json(
        { error: response.error || 'Failed to retrieve sessions' },
        { status: response.statusCode || 500 }
      );
    }
    
    if (!response.data?.length) {
      return NextResponse.json({ sessions: [], pagination: { cursor, nextCursor: null, hasMore: false, total: 0, limit } });
    }

    const sessionIds = response.data;
    const total = sessionIds.length;

    const start = Math.min(cursor, total);
    const end = Math.min(start + limit, total);
    const pageIds = sessionIds.slice(start, end);

    const sessionPromises = pageIds.map(sessionId => getKVValue<Session>(sessionId, { storeName: config.defaultStoreName }));
    const sessionResults = await Promise.all(sessionPromises);
    const sessions = sessionResults
      .filter(result => result.success && result.data)
      .map(result => result.data as Session);

    const hasMore = end < total;
    const nextCursor = hasMore ? end : null;

    return NextResponse.json({
      sessions,
      pagination: { cursor: start, nextCursor, hasMore, total, limit }
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

    const session = validation.data;

    // Process any messages to ensure timestamps are in ISO string format
    if (session.messages && session.messages.length > 0) {
      session.messages = session.messages.map((message: Message) => {
        if (message.timestamp) {
          return {
            ...message,
            timestamp: toISOString(message.timestamp)
          };
        }
        return message;
      });
    }

    const sessionKey = `${userId}_${session.sessionId}`;

    // Save the session data
    const sessionResponse = await setKVValue(
      sessionKey,
      session,
      { storeName: config.defaultStoreName }
    );

    if (!sessionResponse.success) {
      return NextResponse.json(
        { error: sessionResponse.error || 'Failed to create session' },
        { status: sessionResponse.statusCode || 500 }
      );
    }

    // Update the sessions list with just the session ID
    const allSessionsResponse = await getKVValue<string[]>(userId, { storeName: config.defaultStoreName });
    const sessionIds = allSessionsResponse.success ? allSessionsResponse.data || [] : [];

    // Add the new session ID to the beginning of the array
    const updatedSessionIds = [sessionKey, ...sessionIds.filter(id => id !== sessionKey)];

    const sessionsListResponse = await setKVValue(
      userId,
      updatedSessionIds,
      { storeName: config.defaultStoreName }
    );

    if (!sessionsListResponse.success) {
      return NextResponse.json(
        { error: sessionsListResponse.error || 'Failed to update sessions list' },
        { status: sessionsListResponse.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
      ...(session.title ? {} : { titleGeneration: 'pending' })
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
