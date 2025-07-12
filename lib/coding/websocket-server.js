const ws = require('ws');
const { spawn } = require('child_process');
const { createServer } = require('http');
const { parse } = require('url');
const { writeFile, unlink } = require('fs/promises');
const { join } = require('path');
const { tmpdir } = require('os');

class CodingWebSocketServer {
  constructor(port = 8082) {
    this.port = port;
    this.sessions = new Map();
    
    // Create HTTP server for WebSocket upgrade
    const server = createServer();
    
    // Create WebSocket server
    this.wss = new ws.Server({ 
      server,
      path: '/coding'
    });

    this.setupWebSocketHandlers();
    
    server.listen(port, () => {
      console.log(`Coding WebSocket server running on port ${port}`);
      console.log('Note: Using direct Python execution');
    });
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (wsocket, req) => {
      const url = parse(req.url, true);

      // TODO: sessionId should come from user information - limit session user per user.
      const sessionId = url.query.sessionId || this.generateSessionId();
      
      console.log(`New coding session connection: ${sessionId}`);
      
      // Create session immediately (no Docker container)
      const session = {
        id: sessionId,
        socket: wsocket,
        createdAt: new Date(),
        isReady: true
      };
      
      this.sessions.set(sessionId, session);
      
      // Send connection success immediately
      wsocket.send(JSON.stringify({
        type: 'connected',
        sessionId,
        message: 'Simple coding session established (direct Python)'
      }));
      
      wsocket.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(sessionId, message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      wsocket.on('close', () => {
        console.log(`Coding session closed: ${sessionId}`);
        this.sessions.delete(sessionId);
      });

      wsocket.on('error', (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error);
        this.sessions.delete(sessionId);
      });
    });
  }

  handleMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`Session not found: ${sessionId}`);
      return;
    }

    switch (message.type) {
      case 'execute':
        console.log(`Executing code in session ${sessionId}:`, message.code);
        this.executeCode(session, message.code);
        break;
        
      case 'ping':
        session.socket.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
        
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  async executeCode(session, code) {
    try {
      // Create temporary file
      const tempFileName = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.py`;
      const tempFilePath = join(tmpdir(), tempFileName);
      
      await writeFile(tempFilePath, code);
      console.log(`Running Python file: ${tempFilePath}`);
      
      // Execute Python directly
      const python = spawn('python3', [tempFilePath]);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', async (code) => {
        console.log(`Execution completed with code: ${code}`);
        console.log(`Output: ${stdout}`);
        if (stderr) console.log(`Error: ${stderr}`);
        
        // Clean up temp file
        try {
          await unlink(tempFilePath);
        } catch (err) {
          console.error('Error cleaning up temp file:', err);
        }
        
        session.socket.send(JSON.stringify({
          type: 'execution_result',
          success: code === 0,
          output: stdout,
          error: stderr,
          exitCode: code,
          timestamp: new Date().toISOString()
        }));
      });

      python.on('error', async (error) => {
        console.error('Python execution error:', error);
        
        // Clean up temp file
        try {
          await unlink(tempFilePath);
        } catch (err) {
          console.error('Error cleaning up temp file:', err);
        }
        
        session.socket.send(JSON.stringify({
          type: 'execution_result',
          success: false,
          error: `Execution failed: ${error.message}`,
          timestamp: new Date().toISOString()
        }));
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        python.kill();
        session.socket.send(JSON.stringify({
          type: 'execution_result',
          success: false,
          error: 'Execution timeout (10 seconds)',
          timestamp: new Date().toISOString()
        }));
      }, 10000);
      
    } catch (error) {
      console.error('Error setting up execution:', error);
      session.socket.send(JSON.stringify({
        type: 'execution_result',
        success: false,
        error: `Setup failed: ${error.message}`,
        timestamp: new Date().toISOString()
      }));
    }
  }

  generateSessionId() {
    return 'coding_' + Math.random().toString(36).substr(2, 9);
  }

  getActiveSessions() {
    return Array.from(this.sessions.keys());
  }

  closeAllSessions() {
    console.log('Closing all sessions...');
    this.sessions.clear();
    console.log('All sessions closed');
  }
}

// Export a singleton instance
const codingServer = new CodingWebSocketServer(8082);
module.exports = { CodingWebSocketServer, codingServer }; 