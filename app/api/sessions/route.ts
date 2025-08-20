import { NextRequest, NextResponse } from 'next/server';
import { getKVValue, setKVValue } from '@/lib/kv-store';
import { Session } from '@/app/chat/types';
import { toISOString } from '@/app/chat/utils/dateUtils';

// This store service is set up on Agentuity cloud
const KV_STORE_NAME = 'chat-sessions';

/**
 * GET /api/sessions - Get all sessions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('chat_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const response = await getKVValue<string[]>(userId, { storeName: KV_STORE_NAME });
    if (!response.success || !response.data) {
      return NextResponse.json({ sessions: [] });
    }
    const sessionIds = response.data || [];
    if (sessionIds.length === 0) {
      return NextResponse.json({ sessions: [] });
    }
    const limitedSessionIds = sessionIds.slice(0, 10);

    const sessionPromises = limitedSessionIds.map(sessionId =>
      getKVValue<Session>(sessionId, { storeName: KV_STORE_NAME })
    );

    const sessionResults = await Promise.all(sessionPromises);
    const sessions = sessionResults
      .filter(result => result.success && result.data)
      .map(result => result.data as Session);

    return NextResponse.json({ sessions });
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
    const session = await request.json() as Session;

    if (!session || !session.sessionId) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 400 }
      );
    }

    // Process any messages to ensure timestamps are in ISO string format
    if (session.messages && session.messages.length > 0) {
      session.messages = session.messages.map(message => {
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
      { storeName: KV_STORE_NAME }
    );

    if (!sessionResponse.success) {
      return NextResponse.json(
        { error: sessionResponse.error || 'Failed to create session' },
        { status: sessionResponse.statusCode || 500 }
      );
    }

    // Update the sessions list with just the session ID
    const allSessionsResponse = await getKVValue<string[]>(userId, { storeName: KV_STORE_NAME });
    const sessionIds = allSessionsResponse.success ? allSessionsResponse.data || [] : [];

    // Add the new session ID to the beginning of the array
    const updatedSessionIds = [sessionKey, ...sessionIds.filter(id => id !== sessionKey)];

    const sessionsListResponse = await setKVValue(
      userId,
      updatedSessionIds,
      { storeName: KV_STORE_NAME }
    );

    if (!sessionsListResponse.success) {
      return NextResponse.json(
        { error: sessionsListResponse.error || 'Failed to update sessions list' },
        { status: sessionsListResponse.statusCode || 500 }
      );
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}