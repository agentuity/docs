'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatInterfaceProps, ChatSession } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SessionSidebar } from './SessionSidebar';
import { HelpCircle, Terminal as TerminalIcon } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import DynamicTerminalComponent from '../../../components/terminal/DynamicTerminalComponent';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add toggle function after handleTerminalClose
  const toggleEditor = () => {
    setEditorOpen(!editorOpen);
  };

  // Update runCode to use REST API
  const runCode = async () => {
    setExecutionResult('Running code...');
    
    try {
      const response = await fetch('http://localhost:8083/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: editorContent
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setExecutionResult(`Output:\n${result.output || '(no output)'}`);
      } else {
        setExecutionResult(`Error:\n${result.error}`);
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setExecutionResult('Connection error - please try again');
    }
  };



  // Stabilize the onReady callback to prevent re-renders
  const handleTerminalReady = useCallback((terminal: Terminal) => {
    console.log('Terminal ready:', terminal);
  }, []);

  // Stabilize the onClose callback
  const handleTerminalClose = useCallback(() => {
    // setIsTerminalOpen(false); // This is now handled by toggleEditor
  }, []);

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

      const result = await response.json();

      // Update the message with execution results
      setMessages(prev => prev.map(msg =>
        msg.codeBlock?.filename === filename
          ? { ...msg, execution: result }
          : msg
      ));
    } catch (error) {
      console.error('Error executing code:', error);
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
            {/* Terminal Toggle Button */}
            <button
              onClick={toggleEditor}
              className={`absolute top-4 right-4 z-50 p-2 rounded-lg transition-all duration-200 ${editorOpen ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'}`}
              title={editorOpen ? 'Close Editor' : 'Open Editor'}
            >
              <TerminalIcon className="w-4 h-4" />
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

            {/* Terminal Panel - Always mounted but conditionally visible */}
            <div className={`${editorOpen ? 'w-1/2' : 'w-0'} border-l border-white/8 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden`}>
              <div className={`p-4 border-b border-white/8 ${editorOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-200">Code Editor</h3>
                  <button
                    onClick={runCode}
                    className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-md text-sm"
                  >
                    Run
                  </button>
                </div>
              </div>
              <div className={`flex-1 p-4 flex flex-col ${editorOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                <textarea
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="flex-1 w-full bg-black/30 border border-white/10 rounded-lg p-4 text-white font-mono text-sm"
                  placeholder="Write your TypeScript agent code here..."
                />
                {executionResult && (
                  <div className="mt-4 p-4 bg-black/50 rounded-lg">
                    <pre className="text-green-400">{executionResult}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 