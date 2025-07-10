import { NextRequest, NextResponse } from 'next/server';
import { terminalServer } from '@/lib/terminal/websocket-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'sessions':
        // Get active terminal sessions
        const activeSessions = terminalServer.getActiveSessions();
        return NextResponse.json({ 
          success: true, 
          sessions: activeSessions 
        });

      case 'status':
        // Get terminal server status
        return NextResponse.json({ 
          success: true, 
          message: 'Terminal server is running',
          port: 8080
        });

      default:
        return NextResponse.json({ 
          success: true, 
          message: 'Terminal API is ready',
          websocketUrl: 'ws://localhost:8080/terminal'
        });
    }
  } catch (error) {
    console.error('Terminal API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId } = body;

    switch (action) {
      case 'create':
        // Create new terminal session
        // This will be handled by WebSocket connection
        return NextResponse.json({ 
          success: true, 
          message: 'Connect via WebSocket to create session',
          websocketUrl: 'ws://localhost:8080/terminal'
        });

      case 'destroy':
        // Destroy specific session
        if (!sessionId) {
          return NextResponse.json({ 
            success: false, 
            error: 'Session ID required' 
          }, { status: 400 });
        }
        
        // Note: Session destruction is handled by WebSocket server
        return NextResponse.json({ 
          success: true, 
          message: 'Session destruction requested' 
        });

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Unknown action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Terminal API POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Close all terminal sessions
    terminalServer.closeAllSessions();
    
    return NextResponse.json({ 
      success: true, 
      message: 'All terminal sessions closed' 
    });
  } catch (error) {
    console.error('Terminal API DELETE error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 