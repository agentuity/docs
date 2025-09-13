import { NextRequest, NextResponse } from 'next/server';
import { getKVValue, setKVValue, deleteKVValue } from '@/lib/kv-store';
import { Session, Message, SessionSchema, MessageSchema } from '@/app/chat/types';
import { toISOString } from '@/app/chat/utils/dateUtils';
import { config } from '@/lib/config';
import { parseAndValidateJSON, SessionMessageOnlyRequestSchema } from '@/lib/validation/middleware';

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
    const sessionKey = `${userId}_${sessionId}`;
    const response = await getKVValue<Session>(sessionKey, { storeName: config.defaultStoreName });

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Session not found' },
        { status: response.statusCode || 404 }
      );
    }

    return NextResponse.json({ session: response.data });
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
    const sessionKey = `${userId}_${sessionId}`;

    const validation = await parseAndValidateJSON(request, SessionSchema);
    if (!validation.success) {
      return validation.response;
    }

    const session = validation.data;

    if (session.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Session ID mismatch' },
        { status: 400 }
      );
    }

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

    // Update the individual session
    const response = await setKVValue(
      sessionKey,
      session,
      { storeName: config.defaultStoreName }
    );

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to update session' },
        { status: response.statusCode || 500 }
      );
    }

    // Update the master list if needed (ensure the session ID is in the list)
    const allSessionsResponse = await getKVValue<string[]>(userId, { storeName: config.defaultStoreName });
    const sessionIds = allSessionsResponse.success ? allSessionsResponse.data || [] : [];

    // If the session ID isn't in the list, add it to the beginning
    if (!sessionIds.includes(sessionKey)) {
      const updatedSessionIds = [sessionKey, ...sessionIds];

      const sessionsListResponse = await setKVValue(
        userId,
        updatedSessionIds,
        { storeName: config.defaultStoreName }
      );

      if (!sessionsListResponse.success) {
        // Log the error but don't fail the request
        console.error('Failed to update sessions list:', sessionsListResponse.error);
      }
    }

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
    const sessionKey = `${userId}_${sessionId}`;
    // Delete the session data
    const sessionResponse = await deleteKVValue(
      sessionKey,
      { storeName: config.defaultStoreName }
    );

    if (!sessionResponse.success) {
      return NextResponse.json(
        { error: sessionResponse.error || 'Failed to delete session' },
        { status: sessionResponse.statusCode || 500 }
      );
    }

    // Remove from sessions list
    const allSessionsResponse = await getKVValue<string[]>(userId, { storeName: config.defaultStoreName });
    const sessionIds = allSessionsResponse.success ? allSessionsResponse.data || [] : [];

    const updatedSessionIds = sessionIds.filter(id => id !== sessionKey);

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

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions/[sessionId]/messages - Add a message to a session
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
    const sessionKey = `${userId}_${sessionId}`;
    
    const validation = await parseAndValidateJSON(request, SessionMessageOnlyRequestSchema);
    
    if (!validation.success) {
      return validation.response;
    }

    const { message } = validation.data;

    // Get current session
    const sessionResponse = await getKVValue<Session>(sessionKey, { storeName: config.defaultStoreName });
    if (!sessionResponse.success || !sessionResponse.data) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = sessionResponse.data;
    const updatedSession: Session = {
      ...session,
      messages: [...session.messages, message]
    };

    // Update the individual session
    const updateResponse = await setKVValue(
      sessionKey,
      updatedSession,
      { storeName: config.defaultStoreName }
    );

    if (!updateResponse.success) {
      return NextResponse.json(
        { error: updateResponse.error || 'Failed to update session' },
        { status: updateResponse.statusCode || 500 }
      );
    }

    // Move this session ID to the top of the master list (most recently used)
    const allSessionsResponse = await getKVValue<string[]>(userId, { storeName: config.defaultStoreName });
    const sessionIds = allSessionsResponse.success ? allSessionsResponse.data || [] : [];

    // Remove the current session ID if it exists and add it to the beginning
    const filteredSessionIds = sessionIds.filter(id => id !== sessionKey);
    const updatedSessionIds = [sessionKey, ...filteredSessionIds];

    const sessionsListResponse = await setKVValue(
      userId,
      updatedSessionIds,
      { storeName: config.defaultStoreName }
    );

    if (!sessionsListResponse.success) {
      // Log the error but don't fail the request since we already updated the individual session
      console.error('Failed to update sessions list:', sessionsListResponse.error);
    }

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
