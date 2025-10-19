'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Trash2, Maximize2, Minimize2 } from 'lucide-react';

interface TerminalProps {
  sessionId?: string;
}

export function Terminal({ sessionId }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !terminalRef.current || xtermRef.current) return;

    const initTerminal = async () => {
      const { Terminal: XTerm } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');
      await import('@xterm/xterm/css/xterm.css');

      if (!terminalRef.current) return;

      const term = new XTerm({
        cursorBlink: true,
        cursorStyle: 'block',
        fontFamily: '"Cascadia Code", "Fira Code", "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        theme: {
          background: '#0a0a0a',
          foreground: '#e5e7eb',
          cursor: '#22d3ee',
          cursorAccent: '#0a0a0a',
          selectionBackground: '#374151',
          black: '#1f2937',
          red: '#ef4444',
          green: '#10b981',
          yellow: '#f59e0b',
          blue: '#3b82f6',
          magenta: '#a855f7',
          cyan: '#22d3ee',
          white: '#e5e7eb',
          brightBlack: '#4b5563',
          brightRed: '#f87171',
          brightGreen: '#34d399',
          brightYellow: '#fbbf24',
          brightBlue: '#60a5fa',
          brightMagenta: '#c084fc',
          brightCyan: '#67e8f9',
          brightWhite: '#f9fafb',
        },
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      
      term.loadAddon(fitAddon);
      term.loadAddon(webLinksAddon);

      term.open(terminalRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;

      term.writeln('\x1b[1;36m╭─────────────────────────────────────────╮\x1b[0m');
      term.writeln('\x1b[1;36m│\x1b[0m  \x1b[1mWelcome to Agentuity Terminal\x1b[0m       \x1b[1;36m│\x1b[0m');
      term.writeln('\x1b[1;36m╰─────────────────────────────────────────╯\x1b[0m');
      term.writeln('');
      term.writeln('\x1b[90mType commands to interact with your environment.\x1b[0m');
      term.writeln('\x1b[90mThis is a mockup - backend integration coming soon.\x1b[0m');
      term.writeln('');

      let currentLine = '';
      const prompt = () => {
        term.write('\x1b[1;32m$\x1b[0m ');
      };
      prompt();

      const handleCommand = (command: string) => {
        const cmd = command.toLowerCase().trim();
        
        if (cmd === 'clear' || cmd === 'cls') {
          term.clear();
        } else if (cmd === 'help') {
          term.writeln('\x1b[1;36mAvailable commands:\x1b[0m');
          term.writeln('  \x1b[32mclear\x1b[0m     - Clear the terminal');
          term.writeln('  \x1b[32mhelp\x1b[0m      - Show this help message');
          term.writeln('  \x1b[32mls\x1b[0m        - List files (mock)');
          term.writeln('  \x1b[32mpwd\x1b[0m       - Print working directory (mock)');
          term.writeln('  \x1b[32mecho\x1b[0m      - Echo text');
          term.writeln('');
        } else if (cmd === 'ls') {
          term.writeln('\x1b[34mproject/\x1b[0m');
          term.writeln('\x1b[34msrc/\x1b[0m');
          term.writeln('package.json');
          term.writeln('README.md');
          term.writeln('');
        } else if (cmd === 'pwd') {
          term.writeln('/home/user/agentuity-project');
          term.writeln('');
        } else if (cmd.startsWith('echo ')) {
          const text = command.substring(5);
          term.writeln(text);
          term.writeln('');
        } else if (cmd === '') {
        } else {
          term.writeln(`\x1b[31mbash: ${cmd}: command not found\x1b[0m`);
          term.writeln('\x1b[90mTip: Type "help" for available commands\x1b[0m');
          term.writeln('');
        }
      };

      term.onData((data) => {
        const code = data.charCodeAt(0);

        if (code === 13) {
          term.write('\r\n');
          if (currentLine.trim()) {
            handleCommand(currentLine.trim());
          }
          currentLine = '';
          prompt();
        } else if (code === 127) {
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code >= 32) {
          currentLine += data;
          term.write(data);
        }
      });

      const handleResize = () => {
        fitAddon.fit();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
      };
    };

    initTerminal();
  }, [isMounted]);

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.write('\x1b[1;32m$\x1b[0m ');
    }
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    }, 100);
  };

  if (!isMounted) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0a] border-l border-gray-700/50">
        <div className="text-gray-400">Loading terminal...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] border-l border-gray-700/50">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-900/50 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          <span className="ml-2 text-xs text-gray-400 font-medium">bash</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors"
            title="Clear terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleMaximize}
            className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div 
        ref={terminalRef} 
        className="flex-1 p-2 overflow-hidden"
        style={{ 
          height: isMaximized ? 'calc(100vh - 100px)' : '100%'
        }}
      />
    </div>
  );
}
