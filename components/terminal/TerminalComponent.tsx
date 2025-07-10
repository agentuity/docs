'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalComponentProps {
  sessionId?: string;
  onReady?: (terminal: Terminal) => void;
  onClose?: () => void;
  className?: string;
}

export default function TerminalComponent({ 
  sessionId, 
  onReady, 
  onClose, 
  className = '' 
}: TerminalComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Stabilize the onReady callback to prevent useEffect re-runs
  const stableOnReady = useCallback((terminal: Terminal) => {
    if (onReady) {
      onReady(terminal);
    }
  }, []);

  useEffect(() => {
    // Prevent double initialization
    if (!terminalRef.current || isInitialized) return;

    // Create terminal instance
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      theme: {
        background: '#1a1a1a',
        foreground: '#ffffff',
        cursor: '#ffffff',
        black: '#000000',
        red: '#ff6b6b',
        green: '#51cf66',
        yellow: '#ffd43b',
        blue: '#339af0',
        magenta: '#f06595',
        cyan: '#22d3ee',
        white: '#ffffff',
        brightBlack: '#495057',
        brightRed: '#ff8787',
        brightGreen: '#69db7c',
        brightYellow: '#ffe066',
        brightBlue: '#4dabf7',
        brightMagenta: '#f783ac',
        brightCyan: '#5fecff',
        brightWhite: '#ffffff'
      },
      cols: 80,
      rows: 24
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Open terminal in DOM
    terminal.open(terminalRef.current);
    
    // Fit to container
    fitAddon.fit();

    // Store references
    terminalInstance.current = terminal;
    fitAddonRef.current = fitAddon;
    setIsInitialized(true);

    // Connect to WebSocket with delay to ensure terminal is ready
    setTimeout(() => {
      connectWebSocket(terminal);
    }, 100);

    // Handle input from terminal
    terminal.onData((data) => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'input',
          data: data
        }));
      }
    });

    // Handle terminal resize
    terminal.onResize(({ cols, rows }) => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'resize',
          cols,
          rows
        }));
      }
    });

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Call onReady callback
    stableOnReady(terminal);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
        terminalInstance.current = null;
      }
      
      setIsInitialized(false);
    };
  }, []); // Remove onReady dependency to prevent re-runs

  // Separate effect to handle onReady changes after initialization
  useEffect(() => {
    if (isInitialized && terminalInstance.current && onReady) {
      onReady(terminalInstance.current);
    }
  }, [onReady, isInitialized]);

  const connectWebSocket = (terminal: Terminal) => {
    // Prevent multiple connections
    if (websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
      return;
    }

    const wsUrl = `ws://localhost:8080/terminal${sessionId ? `?sessionId=${sessionId}` : ''}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        terminal.write('\r\n\x1b[32m✓ Terminal connected\x1b[0m\r\n');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              terminal.write(`\r\n\x1b[36m> Session: ${message.sessionId}\x1b[0m\r\n`);
              break;
              
            case 'data':
              terminal.write(message.data);
              break;
              
            case 'exit':
              terminal.write(`\r\n\x1b[31m> Process exited with code: ${message.code}\x1b[0m\r\n`);
              break;
              
            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.log('WebSocket connection failed, using mock terminal mode');
        setConnectionError('Using mock terminal mode');
        setIsConnected(false);
        initializeMockTerminal(terminal);
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        
        // Only show close message if it wasn't a clean close
        if (event.code !== 1000) {
          terminal.write('\r\n\x1b[31m✗ Terminal connection closed\x1b[0m\r\n');
        }
        
        // Don't call onClose if this was due to component unmounting
        if (terminalInstance.current && onClose) {
          onClose();
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Using mock terminal mode');
      setIsConnected(false);
      initializeMockTerminal(terminal);
    }
  };

  // Add mock terminal functionality for tutorial purposes
  const initializeMockTerminal = (terminal: Terminal) => {
    let currentPath = '~/agentuity';
    let commandHistory: string[] = [];
    let historyIndex = -1;

    const prompt = () => `\x1b[32m${currentPath}\x1b[0m $ `;
    
    terminal.write('\r\n\x1b[33m📘 Tutorial Mode - Mock Terminal\x1b[0m\r\n');
    terminal.write('This is a demo terminal for the Agentuity tutorial.\r\n');
    terminal.write(prompt());

    const mockCommands = {
      'agentuity agent create': (args: string[]) => {
        const agentName = args[0] || 'my-agent';
        return `\x1b[36m🤖 Creating agent: ${agentName}\x1b[0m\r\n` +
               `\x1b[32m✓ Agent structure created\x1b[0m\r\n` +
               `\x1b[32m✓ Configuration files generated\x1b[0m\r\n` +
               `\x1b[32m✓ Dependencies installed\x1b[0m\r\n\r\n` +
               `\x1b[97mNext steps:\x1b[0m\r\n` +
               `  • Configure your agent: \x1b[36magentuity agent configure\x1b[0m\r\n` +
               `  • Deploy your agent: \x1b[36magentuity deploy\x1b[0m\r\n`;
      },
      'agentuity agent configure': () => {
        return `\x1b[36m⚙️  Configuring agent...\x1b[0m\r\n` +
               `\x1b[32m✓ Environment variables set\x1b[0m\r\n` +
               `\x1b[32m✓ Authentication configured\x1b[0m\r\n` +
               `\x1b[32m✓ Agent settings updated\x1b[0m\r\n\r\n` +
               `\x1b[97mAgent is ready to deploy!\x1b[0m\r\n`;
      },
      'agentuity deploy': () => {
        return `\x1b[36m🚀 Deploying agent...\x1b[0m\r\n` +
               `\x1b[32m✓ Building agent\x1b[0m\r\n` +
               `\x1b[32m✓ Uploading to cloud\x1b[0m\r\n` +
               `\x1b[32m✓ Starting services\x1b[0m\r\n\r\n` +
               `\x1b[97m🎉 Agent deployed successfully!\x1b[0m\r\n` +
               `\x1b[97mURL: https://your-agent.agentuity.com\x1b[0m\r\n`;
      },
      'agentuity logs': () => {
        return `\x1b[36m📄 Recent logs:\x1b[0m\r\n` +
               `\x1b[90m2024-01-15 10:30:15\x1b[0m \x1b[32mINFO\x1b[0m Agent started successfully\r\n` +
               `\x1b[90m2024-01-15 10:30:16\x1b[0m \x1b[32mINFO\x1b[0m Processing request...\r\n` +
               `\x1b[90m2024-01-15 10:30:17\x1b[0m \x1b[32mINFO\x1b[0m Request completed\r\n`;
      },
      'agentuity status': () => {
        return `\x1b[36m📊 Agent Status:\x1b[0m\r\n` +
               `\x1b[32m✓ Status: Running\x1b[0m\r\n` +
               `\x1b[32m✓ Uptime: 2h 15m\x1b[0m\r\n` +
               `\x1b[32m✓ Requests: 142\x1b[0m\r\n` +
               `\x1b[32m✓ Success Rate: 98.6%\x1b[0m\r\n`;
      },
      'help': () => {
        return `\x1b[36m📚 Available Commands:\x1b[0m\r\n` +
               `  \x1b[97magentuity agent create <name>\x1b[0m - Create a new agent\r\n` +
               `  \x1b[97magentuity agent configure\x1b[0m    - Configure agent settings\r\n` +
               `  \x1b[97magentuity deploy\x1b[0m             - Deploy your agent\r\n` +
               `  \x1b[97magentuity logs\x1b[0m               - View agent logs\r\n` +
               `  \x1b[97magentuity status\x1b[0m             - Check agent status\r\n` +
               `  \x1b[97mls\x1b[0m                          - List files\r\n` +
               `  \x1b[97mcd <directory>\x1b[0m               - Change directory\r\n` +
               `  \x1b[97mclear\x1b[0m                       - Clear terminal\r\n`;
      },
      'ls': () => {
        return `\x1b[36magent.ts\x1b[0m      \x1b[36mpackage.json\x1b[0m  \x1b[36mREADME.md\x1b[0m\r\n` +
               `\x1b[36mconfig/\x1b[0m      \x1b[36msrc/\x1b[0m          \x1b[36mtests/\x1b[0m\r\n`;
      },
      'clear': () => {
        terminal.clear();
        return '';
      }
    };

    let currentCommand = '';

    const handleCommand = (command: string) => {
      if (!command.trim()) return;
      
      commandHistory.push(command);
      historyIndex = commandHistory.length;
      
      const args = command.trim().split(' ');
      const baseCommand = args.slice(0, -1).join(' ') || args[0];
      const commandArgs = args.slice(args[0] === 'agentuity' ? 2 : 1);
      
      let output = '';
      if (mockCommands[baseCommand as keyof typeof mockCommands]) {
        output = mockCommands[baseCommand as keyof typeof mockCommands](commandArgs);
      } else if (command.startsWith('agentuity agent create')) {
        output = mockCommands['agentuity agent create'](commandArgs);
      } else {
        output = `\x1b[31mCommand not found: ${command}\x1b[0m\r\n` +
                 `Type 'help' for available commands.\r\n`;
      }
      
      if (output) {
        terminal.write(`\r\n${output}\r\n`);
      }
      terminal.write(prompt());
    };

    // Handle terminal input in mock mode
    terminal.onData((data) => {
      const code = data.charCodeAt(0);
      
      if (code === 13) { // Enter
        terminal.write('\r\n');
        handleCommand(currentCommand);
        currentCommand = '';
      } else if (code === 127) { // Backspace
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (code === 27) { // ESC sequence (arrow keys)
        const next1 = data.charCodeAt(1);
        const next2 = data.charCodeAt(2);
        if (next1 === 91) { // [
          if (next2 === 65) { // Up arrow
            if (historyIndex > 0) {
              historyIndex--;
              terminal.write('\r' + ' '.repeat(currentCommand.length + prompt().length) + '\r');
              currentCommand = commandHistory[historyIndex];
              terminal.write(prompt() + currentCommand);
            }
          } else if (next2 === 66) { // Down arrow
            if (historyIndex < commandHistory.length - 1) {
              historyIndex++;
              terminal.write('\r' + ' '.repeat(currentCommand.length + prompt().length) + '\r');
              currentCommand = commandHistory[historyIndex];
              terminal.write(prompt() + currentCommand);
            }
          }
        }
      } else if (code >= 32 && code <= 126) { // Printable characters
        currentCommand += data;
        terminal.write(data);
      }
    });
  };

  const executeCommand = (command: string) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'command',
        command: command
      }));
    }
  };

  const reconnect = () => {
    if (terminalInstance.current) {
      setConnectionError(null);
      connectWebSocket(terminalInstance.current);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Connection Status */}
      <div className="absolute top-2 right-2 z-10">
        <div className={`flex items-center space-x-2 px-2 py-1 rounded-md text-xs ${
          isConnected 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Error Message */}
      {connectionError && (
        <div className="absolute top-10 right-2 z-10 bg-red-500/20 text-red-400 px-3 py-2 rounded-md text-sm">
          <div className="flex items-center space-x-2">
            <span>{connectionError}</span>
            <button 
              onClick={reconnect}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Terminal Container */}
      <div 
        ref={terminalRef} 
        className="w-full h-full bg-gray-900 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />

      {/* Expose executeCommand for parent components */}
      {React.cloneElement(<div />, { 
        ref: (el: any) => {
          if (el) {
            el.executeCommand = executeCommand;
          }
        }
      })}
    </div>
  );
} 