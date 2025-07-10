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
        selection: '#ffffff20',
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
      rows: 24,
      scrollback: 1000,
      allowTransparency: false,
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Open terminal in DOM
    terminal.open(terminalRef.current);
    
    // Enable focus
    terminal.focus();
    
    // Fit to container
    fitAddon.fit();

    // Store references
    terminalInstance.current = terminal;
    fitAddonRef.current = fitAddon;
    setIsInitialized(true);

    // Setup terminal input handling
    const inputHandler = terminal.onData((data) => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'input',
          data: data
        }));
      }
    });

    // Setup terminal resize handling
    const resizeHandler = terminal.onResize(({ cols, rows }) => {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'resize',
          cols,
          rows
        }));
      }
    });

    // Connect to WebSocket
    connectWebSocket(terminal);

    // Handle window resize
    const handleWindowResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleWindowResize);

    // Call onReady callback
    stableOnReady(terminal);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      
      // Clean up terminal handlers
      inputHandler.dispose();
      resizeHandler.dispose();
      
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
  }, []); // Empty dependency array

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
    
    terminal.write('\x1b[33mConnecting to terminal server...\x1b[0m\r\n');
    
    try {
      const ws = new WebSocket(wsUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        terminal.write('\x1b[32m✓ Terminal connected! You can now type commands.\x1b[0m\r\n');
        
        // Focus the terminal after connection
        terminal.focus();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              terminal.write(`\x1b[36m> Session: ${message.sessionId}\x1b[0m\r\n`);
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
        console.error('WebSocket connection error:', error);
        setConnectionError('Failed to connect to terminal server');
        setIsConnected(false);
        terminal.write('\x1b[31m✗ Failed to connect to terminal server\x1b[0m\r\n');
        terminal.write('\x1b[33mMake sure the terminal server is running on port 8080\x1b[0m\r\n');
        terminal.write('\x1b[33mRun: npm run terminal-server\x1b[0m\r\n');
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        
        if (event.code !== 1000) {
          terminal.write('\r\n\x1b[31m✗ Terminal connection closed\x1b[0m\r\n');
          setConnectionError('Connection lost');
        }
        
        if (terminalInstance.current && onClose) {
          onClose();
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to connect to terminal server');
      setIsConnected(false);
      terminal.write('\x1b[31m✗ Failed to connect to terminal server\x1b[0m\r\n');
      terminal.write('\x1b[33mMake sure the terminal server is running on port 8080\x1b[0m\r\n');
    }
  };

  const reconnect = () => {
    if (terminalInstance.current) {
      setConnectionError(null);
      terminalInstance.current.write('\r\n');
      connectWebSocket(terminalInstance.current);
    }
  };

  const executeCommand = (command: string) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'command',
        command: command
      }));
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
        className="w-full h-full bg-gray-900 rounded-lg overflow-hidden focus:outline-none"
        style={{ minHeight: '400px' }}
        onClick={() => {
          // Focus terminal when clicked
          if (terminalInstance.current) {
            terminalInstance.current.focus();
          }
        }}
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