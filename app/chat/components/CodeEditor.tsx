import React from 'react';
import Split from 'react-split';
import styles from './SplitPane.module.css';

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
  return (
    <div className="h-full flex flex-col min-w-0 overflow-hidden border-l border-white/8">
      <Split
        className={`flex flex-col w-full h-full ${styles.vertical}`}
        direction="vertical"
        sizes={[50, 50]}
        minSize={100}
        gutterSize={6}
        gutterAlign="center"
        snapOffset={30}
      >
        {/* Code Editor Section */}
        <div className="flex flex-col">
          <div className="p-2 md:p-4 border-b border-white/8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 md:gap-3">
                <h3 className="text-xs md:text-sm font-medium text-gray-200">Code Editor</h3>
                {/* Server Status Indicator */}
                <div className={`flex items-center gap-1 md:gap-2 px-1 md:px-2 py-1 rounded-md text-xs ${
                  serverRunning
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  <div className={`w-1.5 md:w-2 h-1.5 md:h-2 rounded-full ${
                    serverRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
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
                  className={`px-2 md:px-3 py-1 rounded-md text-xs md:text-sm ${
                    serverRunning
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
          <div className="flex-1 p-2 md:p-4 flex flex-col">
            <textarea
              value={editorContent}
              onChange={handleEditorContentChange}
              className="flex-1 w-full bg-black/30 border border-white/10 rounded-lg p-2 md:p-4 text-white font-mono text-xs md:text-sm resize-none"
              placeholder="Write your TypeScript agent code here..."
              aria-label="Code editor"
            />
          </div>
        </div>

        {/* Execution Output Section */}
        <div className="flex flex-col">
          <div className="p-2 md:p-4 border-b border-white/8">
            <h3 className="text-xs md:text-sm font-medium text-gray-200">Execution Output</h3>
          </div>
          <div className="flex-1 p-2 md:p-4">
            {executionResult && (
              <div className="h-full overflow-y-auto bg-black/50 rounded-lg p-2 md:p-4">
                <pre className="text-green-400 text-xs md:text-sm whitespace-pre-wrap font-mono">{executionResult}</pre>
              </div>
            )}
            {!executionResult && (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p className="text-xs md:text-sm">Click "Run Code" to see output here</p>
              </div>
            )}
          </div>
        </div>
      </Split>
    </div>
  );
} 