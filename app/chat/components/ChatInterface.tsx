'use client';

import { useRef, useEffect, useState } from 'react';
import { ChatInterfaceProps } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SessionSidebar } from './SessionSidebar';
import { useChatContext } from '../context/ChatContext';
import { WelcomeScreen } from './WelcomeScreen';
import { CodeEditor } from './CodeEditor';
import { ChatMessagesArea } from './ChatMessagesArea';
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
    setEditorContent
  } = useChatContext();

  // Track sidebar state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

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

  // Check if user has scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setShouldAutoScroll(isAtBottom);
  };

  // Auto-scroll only if user is at bottom
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Add scroll listener to the messages container
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

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
          <div className={`flex-1 flex flex-row overflow-hidden relative w-full ${editorOpen ? 'max-w-none' : 'max-w-4xl mx-auto'}`}>
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
                gutter={(index, direction) => {
                  const gutter = document.createElement('div');
                  gutter.className = 'gutter-vscode';
                  gutter.style.cssText = `
                    background: transparent;
                    position: relative;
                    cursor: col-resize;
                    transition: background-color 0.2s ease;
                  `;

                  const dots = document.createElement('div');
                  dots.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 2px;
                    height: 20px;
                    background: repeating-linear-gradient(to bottom, rgba(0, 200, 255, 0.4) 0px, rgba(0, 200, 255, 0.4) 2px, transparent 2px, transparent 6px);
                    border-radius: 1px;
                    transition: background 0.2s ease;
                  `;

                  gutter.addEventListener('mouseenter', () => {
                    dots.style.background = 'repeating-linear-gradient(to bottom, rgba(0, 200, 255, 0.8) 0px, rgba(0, 200, 255, 0.8) 2px, transparent 2px, transparent 6px)';
                    gutter.style.backgroundColor = 'rgba(0, 200, 255, 0.1)';
                  });

                  gutter.addEventListener('mouseleave', () => {
                    dots.style.background = 'repeating-linear-gradient(to bottom, rgba(0, 200, 255, 0.4) 0px, rgba(0, 200, 255, 0.4) 2px, transparent 2px, transparent 6px)';
                    gutter.style.backgroundColor = 'transparent';
                  });

                  gutter.appendChild(dots);
                  return gutter;
                }}
              >
                {/* Chat Messages Area */}
                <ChatMessagesArea
                  messages={messages}
                  messagesContainerRef={messagesContainerRef}
                  messagesEndRef={messagesEndRef}
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                  loading={loading}
                  sendMessage={sendMessage}
                  executeCode={executeCode}
                  handleCodeChange={handleCodeChange}
                  executingFiles={executingFiles}
                />

                {/* Code Editor Component */}
                <CodeEditor
                  editorContent={editorContent}
                  executionResult={executionResult}
                  serverRunning={serverRunning}
                  executingFiles={executingFiles}
                  handleEditorContentChange={handleEditorContentChange}
                  runCode={runCode}
                  stopServer={stopServer}
                  onClose={toggleEditor}
                />
              </Split>
            ) : (
              // Regular chat view when editor is closed
              <ChatMessagesArea
                messages={messages}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
                currentInput={currentInput}
                setCurrentInput={setCurrentInput}
                loading={loading}
                sendMessage={sendMessage}
                executeCode={executeCode}
                handleCodeChange={handleCodeChange}
                executingFiles={executingFiles}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}