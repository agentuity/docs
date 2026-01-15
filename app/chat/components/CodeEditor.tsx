import type React from 'react';
import { useState } from 'react';
import { Play, Terminal, Square, Power, Code, X } from 'lucide-react';

enum TabType {
  CODE = 'code',
  OUTPUT = 'output'
}

interface CodeEditorProps {
  executionResult: string | null;
  serverRunning: boolean;
  executingFiles: string[];
  runCode: (code: string) => void;
  stopServer: () => void;
  editorContent: string;
  setEditorContent: (content: string) => void;
  toggleEditor: () => void;
}

export function CodeEditor({
  executionResult,
  serverRunning,
  runCode,
  stopServer,
  editorContent,
  setEditorContent,
  toggleEditor
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.CODE);

  const handleEditorContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
  };

  const handleRunCode = () => {
    runCode(editorContent);
  };

  return (
    <div className="h-full flex flex-col min-w-[400px] w-full overflow-hidden border-l border-white">
      {/* Tab Header */}
      <div className="p-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab(TabType.CODE)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === TabType.CODE
                  ? 'bg-gray-700/50 text-gray-200'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                <Code className="w-3 h-3" />
                Code
              </button>
              <button
                onClick={() => setActiveTab(TabType.OUTPUT)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors ${activeTab === TabType.OUTPUT
                  ? 'bg-gray-700/50 text-gray-200'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                <Terminal className="w-3 h-3" />
                Output
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {serverRunning && (
              <button
                onClick={stopServer}
                className="p-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                aria-label="Stop server"
                title="Stop Server"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleRunCode}
              disabled={serverRunning}
              className={`p-2 rounded-md transition-colors ${serverRunning
                ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                }`}
              aria-label={serverRunning ? 'Server is running' : 'Run code'}
              title={serverRunning ? 'Server Running' : 'Run Code'}
            >
              {serverRunning ? (
                <Power className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={toggleEditor}
              className="p-2 text-gray-400 hover:text-gray-300 hover:bg-white/5 rounded-md transition-colors"
              aria-label="Close editor"
              title="Close Editor"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === TabType.CODE ? (
          <div className="h-full p-4">
            <textarea
              value={editorContent}
              onChange={handleEditorContentChange}
              className="w-full h-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-sm font-mono text-gray-200 resize-none focus:outline-none focus:border-cyan-500/50"
              placeholder="Enter your code here..."
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="h-full p-4">
            <div className="w-full h-full bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 text-sm font-mono text-gray-200 overflow-auto">
              {executionResult ? (
                <pre className="whitespace-pre-wrap">{executionResult}</pre>
              ) : (
                <span className="text-gray-400">No output yet. Run some code to see results.</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 