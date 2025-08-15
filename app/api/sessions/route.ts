import { NextRequest, NextResponse } from 'next/server';
import { getKVValue, setKVValue, searchKVByKeyword } from '@/lib/kv-store';
import { Session } from '@/app/chat/types';
import { toISOString } from '@/app/chat/utils/dateUtils';

// KV Store keys
const SESSIONS_KEY = 'session_master_list';
const SESSION_PREFIX = 'session_';

/**
 * GET /api/sessions - Get all sessions
 */
export async function GET() {
  try {
    // Get session IDs from master list
    const response = await getKVValue<string[]>(SESSIONS_KEY, { storeName: 'chat-sessions' });
    
    // If the master list doesn't exist yet, return an empty array
    if (!response.success || !response.data) {
      // This is a new user with no sessions yet
      return NextResponse.json({ sessions: [] });
    }

    // Limit to last 10 session IDs
    const sessionIds = response.data || [];
    
    // If there are no sessions, return an empty array
    if (sessionIds.length === 0) {
      return NextResponse.json({ sessions: [] });
    }
    
    const limitedSessionIds = sessionIds.slice(0, 10);
    
    // Fetch each session by ID
    const sessionPromises = limitedSessionIds.map(sessionId => 
      getKVValue<Session>(`${SESSION_PREFIX}${sessionId}`, { storeName: 'chat-sessions' })
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

    // Save the session data
    const sessionResponse = await setKVValue(
      `${SESSION_PREFIX}${session.sessionId}`,
      session,
      { storeName: 'chat-sessions' }
    );

    if (!sessionResponse.success) {
      return NextResponse.json(
        { error: sessionResponse.error || 'Failed to create session' },
        { status: sessionResponse.statusCode || 500 }
      );
    }

    // Update the sessions list with just the session ID
    const allSessionsResponse = await getKVValue<string[]>(SESSIONS_KEY, { storeName: 'chat-sessions' });
    const sessionIds = allSessionsResponse.success ? allSessionsResponse.data || [] : [];
    
    // Add the new session ID to the beginning of the array
    const updatedSessionIds = [session.sessionId, ...sessionIds.filter(id => id !== session.sessionId)];
    
    const sessionsListResponse = await setKVValue(
      SESSIONS_KEY,
      updatedSessionIds,
      { storeName: 'chat-sessions' }
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