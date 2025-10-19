'use client';

import { useState } from 'react';
import { CodeEditor } from '../chat/components/CodeEditor';

export default function TerminalDemoPage() {
  const [editorContent, setEditorContent] = useState('// Try the Terminal tab!\nconsole.log("Hello from Agentuity!");');
  const [executionResult, setExecutionResult] = useState('');
  const [serverRunning, setServerRunning] = useState(false);

  const runCode = (code: string) => {
    setExecutionResult(`Executing code...\n${code}\n\nOutput: Hello from Agentuity!`);
  };

  const stopServer = () => {
    setServerRunning(false);
  };

  const toggleEditor = () => {
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-cyan-400">Terminal Demo - Replit Style</h1>
          <p className="text-sm text-gray-400 mt-1">
            Click the "Terminal" tab to see the interactive terminal mockup
          </p>
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 p-4">
            <div className="bg-gray-800 rounded-lg p-6 h-full">
              <h2 className="text-lg font-semibold mb-4">Chat Area (Placeholder)</h2>
              <div className="space-y-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="text-cyan-400 font-semibold">User:</span> How do I install the Agentuity SDK?
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="text-green-400 font-semibold">Agent:</span> You can install the Agentuity SDK using npm. Try running this command in the terminal:
                  </p>
                  <div className="mt-2 bg-gray-900 rounded p-2 font-mono text-xs">
                    npm install @agentuity/sdk
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-1/2">
            <CodeEditor
              executionResult={executionResult}
              serverRunning={serverRunning}
              executingFiles={[]}
              runCode={runCode}
              stopServer={stopServer}
              editorContent={editorContent}
              setEditorContent={setEditorContent}
              toggleEditor={toggleEditor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
