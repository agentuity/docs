'use client';

import { useRef, useEffect, useState } from 'react';
import { ChatInterfaceProps } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SessionSidebar } from './SessionSidebar';
import { useChatContext } from '../context/ChatContext';
import { WelcomeScreen } from './WelcomeScreen';
import { CodeEditor } from './CodeEditor';
import { Menu, X } from 'lucide-react';
import Split from 'react-split';
import styles from './SplitPane.module.css';

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

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen relative overflow-hidden agentuity-background chat-interface">
      <div className="relative z-10 flex w-full h-full">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden absolute top-4 left-4 z-50 p-2 rounded-lg bg-black/30 text-white/70 hover:bg-black/40"
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar - Absolute positioned on mobile for overlay effect */}
        <div
          className={`${sidebarOpen ? 'block' : 'hidden'} lg:block absolute lg:relative z-40 h-full`}
          style={{ width: '250px' }}
        >
          <SessionSidebar
            currentSessionId={currentSessionId}
            sessions={sessions}
            onSessionSelect={(id) => {
              selectSession(id);
              setSidebarOpen(false); // Close sidebar on mobile after selection
            }}
            onNewSession={() => {
              createNewSession();
              setSidebarOpen(false); // Close sidebar on mobile after creating new session
            }}
          />
        </div>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative p-2 items-center">
          <div className={`flex-1 flex flex-row overflow-hidden relative ${editorOpen ? 'w-full' : 'w-full md:w-3/4 max-w-4xl'}`}>
            {editorOpen ? (
              <Split
                className={`flex w-full h-full ${styles.horizontal}`}
                sizes={[50, 50]}
                minSize={100}
                gutterSize={6}
                gutterAlign="center"
                direction="horizontal"
                cursor="col-resize"
                snapOffset={30}
              >
                {/* Chat Messages Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 agentuity-scrollbar">
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

                  <ChatInput
                    currentInput={currentInput}
                    setCurrentInput={setCurrentInput}
                    loading={loading}
                    sendMessage={sendMessage}
                  />
                </div>

                {/* Code Editor Component */}
                <CodeEditor
                  editorContent={editorContent}
                  executionResult={executionResult}
                  serverRunning={serverRunning}
                  executingFiles={executingFiles}
                  handleEditorContentChange={handleEditorContentChange}
                  runCode={runCode}
                  stopServer={stopServer}
                />
              </Split>
            ) : (
              // Regular chat view when editor is closed
              <div className="flex-1 flex flex-col min-w-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 agentuity-scrollbar">
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

                <ChatInput
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                  loading={loading}
                  sendMessage={sendMessage}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}