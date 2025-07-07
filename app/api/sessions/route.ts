import { NextRequest } from 'next/server';

// Mock session storage (in production, use a database)
const mockSessions = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const sessions = Array.from(mockSessions.values());
    return Response.json({ sessions });
  } catch (error) {
    console.error('Sessions GET error:', error);
    return Response.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();
    
    const sessionId = Date.now().toString();
    const session = {
      id: sessionId,
      title: title || 'New Chat Session',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    
    mockSessions.set(sessionId, session);
    
    return Response.json({ session });
  } catch (error) {
    console.error('Sessions POST error:', error);
    return Response.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
} 