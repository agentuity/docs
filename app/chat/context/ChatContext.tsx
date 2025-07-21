import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { ChatMessage, ChatSession, ConversationMessage, TutorialData, AgentResponse } from '../types';

// Generate unique IDs
const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Agent endpoint
const AGENT_PULSE_URL = 'http://127.0.0.1:3500/agent_ddcb59aa4473f1323be5d9f5fb62b74e';

// Initial dummy session for development
const createInitialSession = (sessionId: string): ChatSession => ({
  id: sessionId,
  messages: [],
  currentFiles: {},
  createdAt: new Date(),
  updatedAt: new Date()
});

interface ChatContextType {
  // State
  messages: ChatMessage[];
  sessions: ChatSession[];
  currentSessionId: string;
  loading: boolean;
  serverRunning: boolean;
  editorContent: string;
  editorOpen: boolean;
  executionResult: string | null;
  executingFiles: Set<string>;
  currentInput: string;
  conversationHistory: ConversationMessage[];
  tutorialData?: TutorialData;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  runCode: () => Promise<void>;
  executeCode: (code: string, filename: string) => Promise<void>;
  handleCodeChange: (code: string, filename: string) => void;
  stopServer: () => Promise<void>;
  checkServerStatus: () => Promise<void>;
  toggleEditor: () => void;
  setCurrentInput: (input: string) => void;
  createNewSession: () => void;
  selectSession: (sessionId: string) => void;
  sendTutorialRequest: (action: string, tutorialId?: string) => Promise<void>;
  setEditorContent: (content: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children, initialSessionId }: { children: ReactNode; initialSessionId: string }) => {
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([createInitialSession(initialSessionId)]);
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
  const [loading, setLoading] = useState(false);
  
  // Editor state
  const [editorContent, setEditorContent] = useState(`print("Hello, World!")`);
  const [editorOpen, setEditorOpen] = useState(false);
  
  // Execution state
  const [serverRunning, setServerRunning] = useState(false);
  const [serverStopping, setServerStopping] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [executingFiles, setExecutingFiles] = useState<Set<string>>(new Set());
  
  // Input state
  const [currentInput, setCurrentInput] = useState('');

  // New state for agent interactions
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [tutorialData, setTutorialData] = useState<TutorialData | undefined>(undefined);

  // Check server status
  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/execute?sessionId=${currentSessionId}`);
      const data = await response.json();
      setServerRunning(data.running || false);
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerRunning(false);
    }
  }, [currentSessionId]);

  // Stop server
  const stopServer = useCallback(async () => {
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
  }, [serverRunning, serverStopping, currentSessionId, executionResult]);

  // Run code in the editor
  const runCode = useCallback(async () => {
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
  }, [editorContent, currentSessionId]);

  // Execute code from a message
  const executeCode = useCallback(async (code: string, filename: string) => {
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
          sessionId: currentSessionId,
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
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.codeBlock?.filename === filename) {
            return {
              ...msg,
              execution: {
                output: 'Starting execution...',
                executionTime: 0,
                exitCode: 0
              }
            };
          }
          return msg;
        })
      );

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
              setMessages(prevMessages => 
                prevMessages.map(msg => {
                  if (msg.codeBlock?.filename === filename) {
                    return {
                      ...msg,
                      execution: { ...currentResult }
                    };
                  }
                  return msg;
                })
              );
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error executing code:', error);
      
      // Update with error state
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.codeBlock?.filename === filename) {
            return {
              ...msg,
              execution: {
                output: '',
                error: 'Connection error - please try again',
                executionTime: 0,
                exitCode: 1
              }
            };
          }
          return msg;
        })
      );
    } finally {
      setExecutingFiles(prev => {
        const newFiles = new Set(prev);
        newFiles.delete(filename);
        return newFiles;
      });
    }
  }, [currentSessionId]);

  // Handle code changes in messages
  const handleCodeChange = useCallback((code: string, filename: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.codeBlock?.filename === filename) {
          return {
            ...msg,
            codeBlock: { ...msg.codeBlock, content: code },
            execution: undefined // Clear previous execution results
          };
        }
        return msg;
      })
    );
  }, []);

  // Toggle editor visibility
  const toggleEditor = useCallback(() => {
    setEditorOpen(prev => !prev);
  }, []);

  // Create a new chat session
  const createNewSession = useCallback(() => {
    const newSessionId = generateId();
    const newSession = createInitialSession(newSessionId);

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setConversationHistory([]); // Reset conversation history for new session
    setTutorialData(undefined); // Reset tutorial data for new session
    
    // Update URL
    window.history.pushState({}, '', `/chat/${newSessionId}`);
  }, []);

  // Select an existing session
  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setMessages([]); // In a real app, load messages for the session
    setConversationHistory([]); // Reset conversation history when changing sessions
    setTutorialData(undefined); // Reset tutorial data when changing sessions
    
    // Update URL
    window.history.pushState({}, '', `/chat/${sessionId}`);
  }, []);

  // Helper to convert between message formats
  const convertToConversationMessage = (message: ChatMessage): ConversationMessage => ({
    role: message.type === 'user' ? 'user' : 'assistant',
    content: message.content
  });

  // Send a tutorial request
  const sendTutorialRequest = useCallback(async (action: string, tutorialId?: string) => {
    setLoading(true);

    try {
      // Prepare the request payload
      const payload = {
        type: 'tutorial',
        action: action,
        message: `I want to ${action} ${tutorialId || ''}`.trim(),
        sessionId: currentSessionId,
        conversationHistory: messages.slice(-10).map(convertToConversationMessage), // Send last 10 messages
        tutorialData: tutorialData // Send current tutorial state if any
      };

      // Send tutorial request to agent-pulse
      const response = await fetch(AGENT_PULSE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to send tutorial request to agent');
      }

      const data = await response.json() as AgentResponse;
      
      // Update conversation history from response
      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }

      // Update tutorial data if present
      if (data.tutorialData) {
        setTutorialData(data.tutorialData);
      }
      
      // Create assistant message from response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: data.response || 'Tutorial request processed',
        timestamp: new Date(),
      };

      // Add code block if available in tutorial data
      if (data.tutorialData?.tutorialStep?.initialCode) {
        assistantMessage.codeBlock = {
          content: data.tutorialData.tutorialStep.initialCode,
          language: 'typescript',
          filename: 'index.ts',
          editable: true
        };
        
        // Auto-open editor for tutorial steps with code
        setEditorOpen(true);
        setEditorContent(data.tutorialData.tutorialStep.initialCode);
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
  }, [currentSessionId, messages, tutorialData]);

  // Send a chat message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setCurrentInput('');

    try {
      // Convert the last few messages to the format expected by the agent
      const recentMessages = [...messages.slice(-10), userMessage].map(convertToConversationMessage);
      
      // Send request to agent-pulse with conversation history and tutorial data
      const response = await fetch(AGENT_PULSE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'chat',
          message: content,
          sessionId: currentSessionId,
          conversationHistory: recentMessages,
          tutorialData: tutorialData // Send current tutorial state if any
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message to agent');
      }

      const data = await response.json() as AgentResponse;
      
      // Update conversation history from response
      if (data.conversationHistory) {
        setConversationHistory(data.conversationHistory);
      }

      // Update tutorial data if present
      if (data.tutorialData) {
        setTutorialData(data.tutorialData);
      }
      
      // Create assistant message from response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        type: 'assistant',
        content: data.response || 'No response from agent',
        timestamp: new Date(),
      };

      // Add code block if available in tutorial data
      if (data.tutorialData?.tutorialStep?.initialCode) {
        assistantMessage.codeBlock = {
          content: data.tutorialData.tutorialStep.initialCode,
          language: 'typescript',
          filename: 'index.ts',
          editable: true
        };
        
        // Auto-open editor for tutorial steps with code
        setEditorOpen(true);
        setEditorContent(data.tutorialData.tutorialStep.initialCode);
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
  }, [currentSessionId, messages, tutorialData]);

  const contextValue = {
    // State
    messages,
    sessions,
    currentSessionId,
    loading,
    serverRunning,
    editorContent,
    editorOpen,
    executionResult,
    executingFiles,
    currentInput,
    conversationHistory,
    tutorialData,
    
    // Actions
    sendMessage,
    runCode,
    executeCode,
    handleCodeChange,
    stopServer,
    checkServerStatus,
    toggleEditor,
    setCurrentInput,
    createNewSession,
    selectSession,
    sendTutorialRequest,
    setEditorContent
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}; 