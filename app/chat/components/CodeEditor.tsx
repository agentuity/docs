import React, { useState } from 'react';
import { Play, Terminal } from 'lucide-react';

interface CodeEditorProps {
  editorContent: string;
  executionResult: string | null;
  serverRunning: boolean;
  executingFiles: Set<string>;
  handleEditorContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  runCode: () => void;
  stopServer: () => void;
}

export function CodeEditor({
  editorContent,
  executionResult,
  serverRunning,
  executingFiles,
  handleEditorContentChange,
  runCode,
  stopServer
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'output'>('code');

  return (
    <div className="h-full flex flex-col min-w-[400px] w-full overflow-hidden border-l border-white">
      {/* Tab Header */}
      <div className="p-2 md:p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === 'code'
                  ? 'bg-gray-700/50 text-gray-200'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                <Terminal className="w-3 h-3" />
                Code
              </button>
              <button
                onClick={() => setActiveTab('output')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === 'output'
                  ? 'bg-gray-700/50 text-gray-200'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                <Play className="w-3 h-3" />
                Output
              </button>
            </div>

            {/* Server Status Indicator */}
            <div className={`flex items-center gap-1 md:gap-2 px-1 md:px-2 py-1 rounded-md text-xs ${serverRunning
              ? 'bg-green-500/20 text-green-400'
              : 'bg-gray-500/20 text-gray-400'
              }`}>
              <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${serverRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`} />
              <span className="text-xs">{serverRunning ? 'Server Running' : 'Server Stopped'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {serverRunning && (
              <button
                onClick={stopServer}
                className="px-2 md:px-3 py-1 bg-red-500/20 text-red-400 rounded-md text-xs md:text-sm hover:bg-red-500/30 disabled:opacity-50"
                aria-label="Stop server"
              >
                Stop Server
              </button>
            )}
            <button
              onClick={runCode}
              disabled={serverRunning}
              className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm ${serverRunning
                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                }`}
              aria-label={serverRunning ? 'Server is running' : 'Run code'}
            >
              {serverRunning ? 'Server Running' : 'Run Code'}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-2 md:p-4 min-h-0">
        {activeTab === 'code' && (
          <div className="h-full flex flex-col min-h-0">
            <textarea
              value={editorContent}
              onChange={handleEditorContentChange}
              className="flex-1 w-full p-2 md:p-4 text-white font-mono text-sm resize-none min-h-0 bg-transparent border-none outline-none "
              placeholder="Write your TypeScript agent code here..."
              aria-label="Code editor"
            />
          </div>
        )}

        {activeTab === 'output' && (
          <div className="h-full overflow-y-auto bg-black/50 rounded-lg p-2 md:p-4 min-h-0">
            <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">
              {executionResult || 'Click "Run Code" to see output here'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 