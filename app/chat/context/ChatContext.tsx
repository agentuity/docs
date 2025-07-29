import { createContext, useContext, useState, ReactNode } from 'react';
import { ChatMessage, ConversationMessage, TutorialData } from '../types';
import { useStreaming } from '../hooks/useStreaming';
import { useCodeExecution } from '../hooks/useCodeExecution';
import { useSessionManagement } from '../hooks/useSessionManagement';
import { useEditorManagement } from '../hooks/useEditorManagement';

interface ChatContextType {
  // State
  messages: ChatMessage[];
  sessions: any[];
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
  status: string | null;

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
  setEditorContent: (content: string) => void;
  setEditorOpen: (open: boolean) => void;
  clearStatus: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children, initialSessionId }: { children: ReactNode; initialSessionId: string }) => {
  // Core state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Execution state
  const [serverRunning, setServerRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  // Input state
  const [currentInput, setCurrentInput] = useState('');

  // New state for agent interactions
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [tutorialData, setTutorialData] = useState<TutorialData | undefined>(undefined);

  // Use extracted hooks
  const editor = useEditorManagement();
  const sessions = useSessionManagement({
    initialSessionId,
    setMessages,
    setConversationHistory,
    setTutorialData
  });

  const codeExecution = useCodeExecution({
    currentSessionId: sessions.currentSessionId,
    messages,
    setMessages,
    setExecutionResult,
    setServerRunning
  });

  const streaming = useStreaming({
    messages,
    setMessages,
    setConversationHistory,
    setTutorialData,
    setEditorOpen: editor.setEditorOpen,
    setEditorContent: editor.setEditorContent,
    setLoading
  });

  // Wrapper for sendMessage to include tutorial data
  const sendMessage = async (content: string) => {
    await streaming.sendMessage(content, tutorialData);
  };

  // Wrapper for runCode to include editor content
  const runCode = async () => {
    await codeExecution.runCode(editor.editorContent);
  };

  const contextValue = {
    // State
    messages,
    sessions: sessions.sessions,
    currentSessionId: sessions.currentSessionId,
    loading,
    serverRunning,
    editorContent: editor.editorContent,
    editorOpen: editor.editorOpen,
    executionResult,
    executingFiles: codeExecution.executingFiles,
    currentInput,
    conversationHistory,
    tutorialData,
    status: streaming.status,

    // Actions
    sendMessage,
    runCode,
    executeCode: codeExecution.executeCode,
    handleCodeChange: codeExecution.handleCodeChange,
    stopServer: codeExecution.stopServer,
    checkServerStatus: codeExecution.checkServerStatus,
    toggleEditor: editor.toggleEditor,
    setCurrentInput,
    createNewSession: sessions.createNewSession,
    selectSession: sessions.selectSession,
    setEditorContent: editor.setEditorContent,
    setEditorOpen: editor.setEditorOpen,
    clearStatus: streaming.clearStatus
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