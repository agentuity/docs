'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ChatInterfaceProps, ChatSession } from '../types';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SessionSidebar } from './SessionSidebar';
import { HelpCircle, Terminal as TerminalIcon } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { DynamicIsland } from '../../../components/DynamicIsland/DynamicIsland';
import { useTutorial } from '../../../components/DynamicIsland/useTutorial';
import { TutorialStep } from '../../../components/DynamicIsland/types';
import DynamicTerminalComponent from '../../../components/terminal/DynamicTerminalComponent';

// Extended tutorial step with keywords for chat detection
interface ChatTutorialStep extends TutorialStep {
  keywords: string[];
}

// Tutorial configuration
const tutorialSteps: ChatTutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Agentuity',
    description: 'Learn the basics of creating and deploying AI agents',
    icon: '🚀',
    estimatedTime: '5 min',
    completed: false,
    keywords: ['hello', 'start', 'begin', 'tutorial', 'help', 'getting started']
  },
  {
    id: 'create-agent',
    title: 'Create Your First Agent',
    description: 'Learn how to create and configure your first AI agent using the terminal',
    icon: '🤖',
    estimatedTime: '10 min',
    completed: false,
    keywords: ['create', 'agent', 'new agent', 'build', 'make', 'terminal', 'agentuity create']
  },
  {
    id: 'configure',
    title: 'Configure Agent Settings',
    description: 'Configure authentication, environment, and deployment settings',
    icon: '⚙️',
    estimatedTime: '15 min',
    completed: false,
    keywords: ['configure', 'settings', 'auth', 'environment', 'config']
  },
  {
    id: 'deploy',
    title: 'Deploy Your Agent',
    description: 'Deploy your agent to the Agentuity platform',
    icon: '🚀',
    estimatedTime: '8 min',
    completed: false,
    keywords: ['deploy', 'launch', 'publish', 'release', 'live']
  },
  {
    id: 'monitor',
    title: 'Monitor & Optimize',
    description: 'Learn to monitor your agent and optimize its performance',
    icon: '📊',
    estimatedTime: '12 min',
    completed: false,
    keywords: ['monitor', 'optimize', 'performance', 'analytics', 'logs']
  }
];

const initialTutorial = {
  id: 'agentuity-tutorial',
  title: 'Agentuity Getting Started',
  currentStep: 0,
  totalSteps: tutorialSteps.length,
  steps: tutorialSteps,
  isActive: true
};

const tutorialMessages = {
  welcome: "Welcome to Agentuity! 🚀 I'm here to help you build amazing AI agents. Let's start by creating your first agent - click the terminal button to get started with interactive commands!",
  'create-agent': "Great! Let's create your first agent using the terminal. Click the terminal button in the top-right corner, then run: `agentuity agent create my-first-agent`. This will guide you through the setup process step by step!",
  configure: "Perfect! Now let's configure your agent. In the terminal, you can set up authentication and environment variables. Try running: `agentuity agent configure` to see available options.",
  deploy: "Excellent! Time to deploy your agent to the cloud. In the terminal, run: `agentuity deploy` to launch your agent live! Make sure your code is ready first.",
  monitor: "Amazing! Your agent is now live. Use the terminal to check logs with: `agentuity logs` and monitor performance with: `agentuity status`. You can also explore the analytics dashboard!"
};

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
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tutorial state
  const tutorialHook = useTutorial(initialTutorial);

  // Stabilize the onReady callback to prevent re-renders
  const handleTerminalReady = useCallback((terminal: Terminal) => {
    console.log('Terminal ready:', terminal);
  }, []);

  // Stabilize the onClose callback
  const handleTerminalClose = useCallback(() => {
    setIsTerminalOpen(false);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Tutorial message detection
  const detectTutorialProgress = (message: string) => {
    const lowerMessage = message.toLowerCase();

    // Check if message contains keywords for advancing tutorial
    const currentStep = tutorialSteps[tutorialHook.tutorial.currentStep];
    const nextStep = tutorialSteps[tutorialHook.tutorial.currentStep + 1];

    if (nextStep && currentStep.keywords.some(keyword => lowerMessage.includes(keyword))) {
      tutorialHook.nextStep();
      return true;
    }

    return false;
  };

  // Generate tutorial bot response
  const generateTutorialResponse = (userMessage: string): ChatMessage | null => {
    const lowerMessage = userMessage.toLowerCase();

    // Check if this is a tutorial-related message
    const currentStep = tutorialSteps[tutorialHook.tutorial.currentStep];
    const isTutorialMessage = currentStep.keywords.some(keyword => lowerMessage.includes(keyword));

    if (isTutorialMessage) {
      const responseText = tutorialMessages[currentStep.id as keyof typeof tutorialMessages];
      if (responseText) {
        // Auto-open terminal for terminal-based tutorial steps
        if (currentStep.id === 'create-agent' || currentStep.id === 'configure' || currentStep.id === 'deploy') {
          setTimeout(() => {
            setIsTerminalOpen(true);
          }, 1000); // Delay to let the message appear first
        }

        return {
          id: generateId(),
          type: 'assistant',
          content: responseText,
          timestamp: new Date(),
        };
      }
    }

    return null;
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
      // Check for tutorial progression
      detectTutorialProgress(content);

      // Try to generate a tutorial response first
      const tutorialResponse = generateTutorialResponse(content);

      if (tutorialResponse) {
        // Use tutorial response
        setMessages(prev => [...prev, tutorialResponse]);
        setLoading(false);
        return;
      }

      // Otherwise, use the normal API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      // Convert timestamp string back to Date object
      const assistantMessage: ChatMessage = {
        ...data.message,
        timestamp: new Date(data.message.timestamp)
      };
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

  // Terminal handlers
  const toggleTerminal = () => {
    setIsTerminalOpen(!isTerminalOpen);
  };

  const handleTerminalCommand = (command: string) => {
    // Handle special terminal commands for tutorials
    if (command.includes('agentuity')) {
      // This could trigger tutorial progression
      console.log('Agentuity command detected:', command);
    }
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
            {/* Dynamic Island - positioned at top center of chat window */}
            <div className="absolute top-4 left-0 right-0 flex justify-center z-50">
              <DynamicIsland
                tutorial={tutorialHook.tutorial}
                onNextStep={tutorialHook.nextStep}
                onPreviousStep={tutorialHook.previousStep}
                onSkipStep={tutorialHook.skipStep}
              />
            </div>

            {/* Terminal Toggle Button */}
            <button
              onClick={toggleTerminal}
              className={`absolute top-4 right-4 z-50 p-2 rounded-lg transition-all duration-200 ${isTerminalOpen
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                }`}
              title={isTerminalOpen ? 'Close Terminal' : 'Open Terminal'}
            >
              <TerminalIcon className="w-4 h-4" />
            </button>

            {/* Chat Messages Area */}
            <div className={`flex-1 flex flex-col ${isTerminalOpen ? 'min-w-0' : ''}`}>
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
                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mb-8">
                      <button
                        onClick={() => {
                          sendMessage("Create my first agent");
                          setIsTerminalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-3 agentuity-button-primary rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <span>🚀</span>
                        Create First Agent
                      </button>
                      <button
                        onClick={() => sendMessage("Continue My Tutorial")}
                        className="flex items-center gap-2 px-4 py-3 agentuity-button rounded-xl text-sm font-medium text-gray-200 transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <span>📚</span>
                        Continue My Tutorial
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
            <div className={`${isTerminalOpen ? 'w-1/2' : 'w-0'} border-l border-white/8 flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden`}>
              <div className={`p-4 border-b border-white/8 ${isTerminalOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-200">Terminal</h3>
                </div>
              </div>
              <div className={`flex-1 p-4 ${isTerminalOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                <DynamicTerminalComponent
                  onReady={handleTerminalReady}
                  onClose={handleTerminalClose}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 