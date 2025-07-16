'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatInterfaceProps, ChatSession } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SessionSidebar } from './SessionSidebar';
import { HelpCircle, Code } from 'lucide-react';

// Agent endpoints
const AGENT_PULSE_URL = 'http://127.0.0.1:3500/agent_ddcb59aa4473f1323be5d9f5fb62b74e';

// Generate unique IDs
const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Dummy sessions for MVP
const createDummySessions = (): ChatSession[] => [
  {
    id: 'session-1',
    messages: [
      {
        id: '1',
        type: 'user',
        content: 'How do I create an Agentuity agent?',
        timestamp: new Date('2024-01-15T10:30:00')
      }
    ],
    currentFiles: {},
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:35:00')
  },
  {
    id: 'session-2',
    messages: [
      {
        id: '2',
        type: 'user',
        content: 'What are the best practices for agent development?',
        timestamp: new Date('2024-01-14T14:20:00')
      }
    ],
    currentFiles: {},
    createdAt: new Date('2024-01-14T14:20:00'),
    updatedAt: new Date('2024-01-14T14:45:00')
  },
  {
    id: 'session-3',
    messages: [
      {
        id: '3',
        type: 'user',
        content: 'Can you show me a TypeScript example?',
        timestamp: new Date('2024-01-13T09:15:00')
      }
    ],
    currentFiles: {},
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-13T09:30:00')
  }
];

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(createDummySessions());
  const [executingFiles, setExecutingFiles] = useState<Set<string>>(new Set());
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [editorContent, setEditorContent] = useState(`print("Hello, World!")`);
  const [editorOpen, setEditorOpen] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [serverRunning, setServerRunning] = useState(false);
  const [serverStopping, setServerStopping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Toggle function for code editor panel
  const toggleEditor = () => {
    setEditorOpen(!editorOpen);
  };

  // Check server status
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`/api/execute?sessionId=${currentSessionId}`);
      const data = await response.json();
      setServerRunning(data.running || false);
      
      // You could add idle time display here if needed
      if (data.running && data.idleTimeMs) {
        const idleMinutes = Math.floor(data.idleTimeMs / 60000);
        const timeoutMinutes = Math.floor(data.timeoutMs / 60000);
        console.log(`Server idle for ${idleMinutes}/${timeoutMinutes} minutes`);
      }
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerRunning(false);
    }
  };

  // Stop server function
  const stopServer = async () => {
    if (!serverRunning || serverStopping) return;
    
    setServerStopping(true);
    try {
      const response = await fetch(`/api/execute?sessionId=${currentSessionId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setServerRunning(false);
        setExecutionResult(prev => prev + '\n\n🛑 Server stopped by user');
      } else {
        const error = await response.json();
        setExecutionResult(prev => prev + `\n\n❌ Failed to stop server: ${error.message}`);
      }
    } catch (error) {
      console.error('Error stopping server:', error);
      setExecutionResult(prev => prev + '\n\n❌ Error stopping server');
    } finally {
      setServerStopping(false);
    }
  };

  // Check server status on component mount and session change
  useEffect(() => {
    checkServerStatus();
  }, [currentSessionId]);

  // Periodic status check when server is running
  useEffect(() => {
    if (!serverRunning) return;

    const interval = setInterval(() => {
      checkServerStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [serverRunning, currentSessionId]);

  // Cleanup on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (serverRunning) {
        // Try to stop the server (best effort)
        fetch(`/api/execute?sessionId=${currentSessionId}`, { method: 'DELETE' }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [serverRunning, currentSessionId]);

  // Update runCode to use the Next.js API with streaming support
  const runCode = async () => {
    setExecutionResult('Running code...');
    setServerRunning(true);
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: editorContent,
          filename: 'editor.ts',
          sessionId: currentSessionId,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute code');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let outputBuffer = '';
      let errorBuffer = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setExecutionResult(data.message);
                  break;
                case 'stdout':
                  outputBuffer += data.data;
                  setExecutionResult(`Output:\n${outputBuffer}`);
                  break;
                case 'stderr':
                  errorBuffer += data.data;
                  setExecutionResult(`Error:\n${errorBuffer}`);
                  break;
                case 'close':
                  setServerRunning(false);
                  if (data.exitCode === 0) {
                    setExecutionResult(`Output:\n${outputBuffer || '(no output)'}`);
                  } else {
                    setExecutionResult(`Process exited with code ${data.exitCode}\nError:\n${errorBuffer}`);
                  }
                  break;
                case 'timeout':
                  setServerRunning(false);
                  setExecutionResult(prev => `${prev}\n\n🕐 ${data.message}`);
                  break;
                case 'error':
                  setServerRunning(false);
                  setExecutionResult(`Error:\n${data.error}`);
                  break;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setServerRunning(false);
      setExecutionResult('Connection error - please try again');
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);



  const sendTutorialRequest = async (action: string, tutorialId?: string) => {
    setLoading(true);

    try {
      // Send tutorial request to agent-pulse
      const response = await fetch(AGENT_PULSE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'tutorial',
          action: action,
          tutorialId: tutorialId,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send tutorial request to agent');
      }

      const data = await response.json();
      
      // Handle tutorial response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: data.message || 'Tutorial request processed',
        timestamp: new Date(),
      };

      if (data.tutorials && data.tutorials.data) {
        // Tutorial list response
        assistantMessage.content = `${data.message}\n\nAvailable tutorials:\n${data.tutorials.data.map((t: any, i: number) => `${i + 1}. **${t.title}** - ${t.description}`).join('\n')}`;
      } else if (data.tutorialTitle) {
        // Tutorial step response
        assistantMessage.content = `**${data.tutorialTitle}** - Step ${data.currentStep}/${data.totalSteps}\n\n**${data.stepTitle || data.title}**\n\n${data.stepContent || data.content}\n\n${data.instructions}`;
        
        // Add code block if available
        if (data.initialCode) {
          assistantMessage.codeBlock = {
            content: data.initialCode,
            language: 'typescript',
            filename: 'index.ts',
            editable: true
          };
          
          // Auto-open editor for tutorial steps with code
          setEditorOpen(true);
          setEditorContent(data.initialCode);
        }
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending tutorial request:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your tutorial request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Send request to agent-pulse
      const response = await fetch(AGENT_PULSE_URL, { // agent-pulse endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat',
          message: content,
          sessionId: currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message to agent');
      }

      const data = await response.json();
      
      // Handle agent response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: data.response || data.message || 'No response from agent',
        timestamp: new Date(),
      };

      // If it's a tutorial response, handle tutorial-specific data
      if (data.type === 'tutorial') {
        if (data.tutorials && data.tutorials.data) {
          // Tutorial list response
          assistantMessage.content = `${data.message}\n\nAvailable tutorials:\n${data.tutorials.data.map((t: any, i: number) => `${i + 1}. **${t.title}** - ${t.description}`).join('\n')}`;
        } else if (data.tutorialTitle) {
          // Tutorial step response
          assistantMessage.content = `**${data.tutorialTitle}** - Step ${data.currentStep}/${data.totalSteps}\n\n**${data.stepTitle || data.title}**\n\n${data.stepContent || data.content}\n\n${data.instructions}`;
          
          // Add code block if available
          if (data.initialCode) {
            assistantMessage.codeBlock = {
              content: data.initialCode,
              language: 'typescript',
              filename: 'index.ts',
              editable: true
            };
            
            // Auto-open editor for tutorial steps with code
            setEditorOpen(true);
            setEditorContent(data.initialCode);
          }
        }
      }

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const executeCode = async (code: string, filename: string) => {
    setExecutingFiles(prev => new Set(prev).add(filename));

    // Determine if this is a tutorial execution
    const isTutorialCode = filename === 'index.ts' && code.includes('@agentuity/sdk');
    const tutorialId = isTutorialCode ? 'typescript-sdk' : undefined;
    const stepId = isTutorialCode ? 1 : undefined; // For now, default to step 1

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          filename,
          sessionId,
          tutorialId,
          stepId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute code');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let outputBuffer = '';
      let errorBuffer = '';
      let currentResult = { output: '', error: undefined as string | undefined, executionTime: 0, exitCode: 0 };

      if (!reader) {
        throw new Error('No response body');
      }

      // Update UI immediately to show execution started
      setMessages(prev => prev.map(msg =>
        msg.codeBlock?.filename === filename
          ? { 
            ...msg, 
            execution: { 
              output: 'Starting execution...', 
              executionTime: 0,
              exitCode: 0
            } 
          }
          : msg
      ));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  currentResult.output = data.message;
                  break;
                case 'stdout':
                  outputBuffer += data.data;
                  currentResult.output = outputBuffer;
                  break;
                case 'stderr':
                  errorBuffer += data.data;
                  currentResult.error = errorBuffer;
                  break;
                case 'close':
                  currentResult.exitCode = data.exitCode || 0;
                  currentResult.output = outputBuffer || '(no output)';
                  if (errorBuffer) {
                    currentResult.error = errorBuffer;
                  }
                  break;
                case 'timeout':
                  currentResult.error = data.message;
                  currentResult.exitCode = 1;
                  break;
                case 'error':
                  currentResult.error = data.error;
                  currentResult.exitCode = 1;
                  break;
              }

              // Update the message with current execution results
              setMessages(prev => prev.map(msg =>
                msg.codeBlock?.filename === filename
                  ? { ...msg, execution: { ...currentResult } }
                  : msg
              ));
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error executing code:', error);
      
      // Update with error state
      setMessages(prev => prev.map(msg =>
        msg.codeBlock?.filename === filename
          ? { 
            ...msg, 
            execution: { 
              output: '',
              error: 'Connection error - please try again',
              executionTime: 0,
              exitCode: 1
            }
          }
          : msg
      ));
    } finally {
      setExecutingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(filename);
        return newSet;
      });
    }
  };

  const handleCodeChange = (code: string, filename: string) => {
    // Update the message with new code
    setMessages(prev => prev.map(msg =>
      msg.codeBlock?.filename === filename
        ? {
          ...msg,
          codeBlock: { ...msg.codeBlock, content: code },
          execution: undefined // Clear previous execution results
        }
        : msg
    ));
  };

  // Session handlers
  const handleSessionSelect = (newSessionId: string) => {
    // In a real app, this would load messages for the session
    console.log('Switching to session:', newSessionId);
    // Update current session ID for sidebar highlighting
    setCurrentSessionId(newSessionId);
    // For MVP, just clear current messages and show which session is selected
    setMessages([]);
    window.history.pushState({}, '', `/chat/${newSessionId}`);
  };

  const handleNewSession = () => {
    // Create a new session
    const newSessionId = generateId();
    const newSession: ChatSession = {
      id: newSessionId,
      messages: [],
      currentFiles: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
    window.history.pushState({}, '', `/chat/${newSessionId}`);
  };

  return (
    <div className="flex h-screen relative overflow-hidden agentuity-background chat-interface">
      <div className="relative z-10 flex w-full h-full">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block relative`}>
          <SessionSidebar
            currentSessionId={currentSessionId}
            sessions={sessions}
            onSessionSelect={handleSessionSelect}
            onNewSession={handleNewSession}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative p-2">
          <div className={`flex-1 flex flex-row bg-black/20 border border-white/10 rounded-2xl overflow-hidden relative`}>
            {/* Code Editor Toggle Button */}
            <button
              onClick={toggleEditor}
              className={`absolute top-4 right-4 z-50 p-2 rounded-lg transition-all duration-200 ${editorOpen ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'}`}
              title={editorOpen ? 'Close Code Editor' : 'Open Code Editor'}
            >
              <Code className="w-4 h-4" />
            </button>

            {/* Chat Messages Area */}
            <div className={`flex-1 flex flex-col ${editorOpen ? 'min-w-0' : ''}`}>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 agentuity-scrollbar">
                {messages.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                      <HelpCircle className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-200 mb-3">
                      Welcome to Agentuity
                    </h3>
                    <p className="text-sm text-gray-300 max-w-md mx-auto leading-relaxed mb-8">
                      Get started with AI agents or continue your learning journey
                    </p>

                    {/* Quick Start Options */}
                    <div className="flex justify-center max-w-lg mx-auto mb-8">
                      <button
                        onClick={() => sendTutorialRequest('list')}
                        className="flex items-center gap-2 px-6 py-3 agentuity-button-primary rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <span>📚</span>
                        Show Available Tutorials
                      </button>
                    </div>

                    <div className="text-xs text-gray-400 max-w-sm mx-auto">
                      Or start typing below for any other questions about Agentuity
                    </div>
                  </div>
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
                {/* Invisible div to scroll to */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-white/8">
                <ChatInput
                  currentInput={currentInput}
                  setCurrentInput={setCurrentInput}
                  loading={loading}
                  sendMessage={(message: string) => {
                    sendMessage(message);
                    setCurrentInput('');
                  }}
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
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${
                        serverRunning 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          serverRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                        }`} />
                        <span>{serverRunning ? 'Server Running' : 'Server Stopped'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {serverRunning && (
                        <button
                          onClick={stopServer}
                          disabled={serverStopping}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded-md text-sm hover:bg-red-500/30 disabled:opacity-50"
                        >
                          {serverStopping ? 'Stopping...' : 'Stop Server'}
                        </button>
                      )}
                      <button
                        onClick={runCode}
                        disabled={serverRunning}
                        className={`px-3 py-1 rounded-md text-sm ${
                          serverRunning 
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed' 
                            : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                        }`}
                      >
                        {serverRunning ? 'Server Running' : 'Run Code'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`flex-1 p-4 flex flex-col ${editorOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    className="flex-1 w-full bg-black/30 border border-white/10 rounded-lg p-4 text-white font-mono text-sm"
                    placeholder="Write your TypeScript agent code here..."
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