'use client';

import { useRef, useEffect, useState } from 'react';
import { ChatInterfaceProps } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SessionSidebar } from './SessionSidebar';
import { Code } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import { WelcomeScreen } from './WelcomeScreen';

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  // Access context values directly
  const {
    messages,
    currentInput,
    loading,
    serverRunning,
    editorOpen,
    editorContent,
    executionResult,
    executingFiles,
    sessions,
    currentSessionId,
    sendMessage,
    executeCode,
    handleCodeChange,
    toggleEditor,
    runCode,
    stopServer,
    checkServerStatus,
    setCurrentInput,
    createNewSession,
    selectSession,
    setEditorContent,
    tutorialData
  } = useChatContext();

  // Track sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check server status on component mount and session change
  useEffect(() => {
    checkServerStatus();
  }, [currentSessionId, checkServerStatus]);

  // Periodic status check when server is running
  useEffect(() => {
    if (!serverRunning) return;

    const interval = setInterval(() => {
      checkServerStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [serverRunning, currentSessionId, checkServerStatus]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (serverRunning) {
        // Try to stop the server (best effort)
        fetch(`/api/execute?sessionId=${currentSessionId}`, { method: 'DELETE' }).catch(() => { });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [serverRunning, currentSessionId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle editor content change
  const handleEditorContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
  };

  return (
    <div className="flex h-screen relative overflow-hidden agentuity-background chat-interface">
      <div className="relative z-10 flex w-full h-full">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block relative`}>
          <SessionSidebar
            currentSessionId={currentSessionId}
            sessions={sessions}
            onSessionSelect={selectSession}
            onNewSession={createNewSession}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative p-2">
          <div className={`flex-1 flex flex-row bg-black/20 border border-white/10 rounded-2xl overflow-hidden relative`}>
            {/* Code Editor Toggle Button */}
            <button
              onClick={() => toggleEditor()}
              className={`absolute top-4 right-4 z-50 p-2 rounded-lg transition-all duration-200 ${editorOpen ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'}`}
              title={editorOpen ? 'Close Code Editor' : 'Open Code Editor'}
              aria-label={editorOpen ? 'Close Code Editor' : 'Open Code Editor'}
            >
              <Code className="w-4 h-4" />
            </button>

            {/* Chat Messages Area */}
            <div className={`flex-1 flex flex-col ${editorOpen ? 'min-w-0' : ''}`}>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 agentuity-scrollbar">
                {messages.length === 0 && (
                  <WelcomeScreen sendMessage={sendMessage} />
                )}

                {messages.map((message) => (
                  <ChatMessageComponent
                    key={message.id}
                    message={message}
                    onCodeExecute={executeCode}
                    onCodeChange={handleCodeChange}
                    executionState={message.codeBlock?.filename && executingFiles.has(message.codeBlock.filename) ? 'running' : 'idle'}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/8">
                <ChatInput
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                  loading={loading}
                  sendMessage={sendMessage}
                />
              </div>
            </div>

            {/* Code Editor Panel - Always mounted but conditionally visible */}
            <div className={`${editorOpen ? 'w-1/2' : 'w-0'} border-l border-white/8 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden`}>
              {/* Code Editor Section */}
              <div className={`${editorOpen ? 'h-1/2' : 'h-0'} border-b border-white/8 flex flex-col`}>
                <div className={`p-4 border-b border-white/8 ${editorOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-gray-200">Code Editor</h3>
                      {/* Server Status Indicator */}
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${serverRunning
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${serverRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                          }`} />
                        <span>{serverRunning ? 'Server Running' : 'Server Stopped'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {serverRunning && (
                        <button
                          onClick={() => stopServer()}
                          disabled={false} // Removed serverStopping since it's not exposed
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded-md text-sm hover:bg-red-500/30 disabled:opacity-50"
                          aria-label="Stop server"
                        >
                          Stop Server
                        </button>
                      )}
                      <button
                        onClick={() => runCode()}
                        disabled={serverRunning}
                        className={`px-3 py-1 rounded-md text-sm ${serverRunning
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
                <div className={`flex-1 p-4 flex flex-col ${editorOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                  <textarea
                    value={editorContent}
                    onChange={handleEditorContentChange}
                    className="flex-1 w-full bg-black/30 border border-white/10 rounded-lg p-4 text-white font-mono text-sm"
                    placeholder="Write your TypeScript agent code here..."
                    aria-label="Code editor"
                  />
                </div>
              </div>

              {/* Execution Output Section */}
              <div className={`${editorOpen ? 'h-1/2' : 'h-0'} flex flex-col`}>
                <div className={`p-4 border-b border-white/8 ${editorOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                  <h3 className="text-sm font-medium text-gray-200">Execution Output</h3>
                </div>
                <div className={`flex-1 p-4 ${editorOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                  {executionResult && (
                    <div className="h-full overflow-y-auto bg-black/50 rounded-lg p-4">
                      <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">{executionResult}</pre>
                    </div>
                  )}
                  {!executionResult && editorOpen && (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <p className="text-sm">Click "Run Code" to see output here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}