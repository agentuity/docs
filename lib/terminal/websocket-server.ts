const ws = require('ws');
const { spawn } = require('node-pty');
const { createServer } = require('http');
const { parse } = require('url');

interface TerminalSession {
  id: string;
  pty: any;
  socket: any;
  userId?: string;
  createdAt: Date;
}

class TerminalWebSocketServer {
  private wss: any;
  private sessions: Map<string, TerminalSession> = new Map();
  private port: number;

  constructor(port: number = 8080) {
    this.port = port;
    
    // Create HTTP server for WebSocket upgrade
    const server = createServer();
    
    // Create WebSocket server
    this.wss = new ws.Server({ 
      server,
      path: '/terminal'
    });

    this.setupWebSocketHandlers();
    
    server.listen(port, () => {
      console.log(`Terminal WebSocket server running on port ${port}`);
    });
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: any, req: any) => {
      const url = parse(req.url!, true);
      const sessionId = url.query.sessionId as string || this.generateSessionId();
      
      console.log(`New terminal connection: ${sessionId}`);
      
      // Create new terminal session
      const session = this.createTerminalSession(sessionId, ws);
      
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(sessionId, message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`Terminal session closed: ${sessionId}`);
        this.closeSession(sessionId);
      });

      ws.on('error', (error: any) => {
        console.error(`WebSocket error for session ${sessionId}:`, error);
        this.closeSession(sessionId);
      });

      // Send initial connection success
      ws.send(JSON.stringify({
        type: 'connected',
        sessionId,
        message: 'Terminal session established'
      }));
    });
  }

  private createTerminalSession(sessionId: string, wsocket: any): TerminalSession {
    // Create a new PTY process (bash shell)
    const pty = spawn('bash', [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-color',
        COLORTERM: 'truecolor'
      }
    });

    const session: TerminalSession = {
      id: sessionId,
      pty,
      socket: wsocket,
      createdAt: new Date()
    };

    // Handle PTY data output
    pty.onData((data: string) => {
      if (wsocket.readyState === ws.OPEN) {
        wsocket.send(JSON.stringify({
          type: 'data',
          data: data
        }));
      }
    });

    // Handle PTY exit
    pty.onExit((e: { exitCode: number; signal?: number }) => {
      if (wsocket.readyState === ws.OPEN) {
        wsocket.send(JSON.stringify({
          type: 'exit',
          code: e.exitCode
        }));
      }
      this.closeSession(sessionId);
    });

    this.sessions.set(sessionId, session);
    return session;
  }

  private handleMessage(sessionId: string, message: any) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`Session not found: ${sessionId}`);
      return;
    }

    switch (message.type) {
      case 'input':
        // Send input to PTY
        session.pty.write(message.data);
        break;
        
      case 'resize':
        // Resize terminal
        session.pty.resize(message.cols, message.rows);
        break;
        
      case 'command':
        // Execute specific command
        session.pty.write(message.command + '\n');
        break;
        
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private closeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        session.pty.kill();
      } catch (error) {
        console.error('Error killing PTY:', error);
      }
      this.sessions.delete(sessionId);
    }
  }

  private generateSessionId(): string {
    return 'term_' + Math.random().toString(36).substr(2, 9);
  }

  public getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  public closeAllSessions() {
    for (const sessionId of this.sessions.keys()) {
      this.closeSession(sessionId);
    }
  }
}

// Export a singleton instance
const terminalServer = new TerminalWebSocketServer(8080);
module.exports = { TerminalWebSocketServer, terminalServer }; 