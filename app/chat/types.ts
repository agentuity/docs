export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlock?: {
    filename: string;
    content: string;
    language: string;
    editable: boolean;
  };
  execution?: {
    output: string;
    error?: string;
    executionTime: number;
    exitCode: number;
  };
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  currentFiles: {
    [filename: string]: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// API types
export interface ExecuteRequest {
  code: string;
  filename: string;
  sessionId: string;
}

export interface ExecuteResponse {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  exitCode?: number;
}

export interface CreateSessionResponse {
  sessionId: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  conversationHistory: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  suggestedCode?: {
    filename: string;
    content: string;
    description: string;
  };
}

// Component props
export interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: ChatMessage[];
}

export interface ChatMessageProps {
  message: ChatMessage;
  onCodeExecute: (code: string, filename: string) => Promise<void>;
  onCodeChange: (code: string, filename: string) => void;
  executionState: 'idle' | 'running' | 'completed' | 'error';
}

export interface CodeBlockProps {
  filename: string;
  content: string;
  language: string;
  editable: boolean;
  onExecute: (code: string, filename: string) => Promise<void>;
  onCodeChange: (code: string) => void;
  executionResult?: ExecuteResponse;
  loading?: boolean;
}

export interface ChatInputProps {
  currentInput: string;
  setCurrentInput: (value: string) => void;
  loading: boolean;
  sendMessage: (message: string) => void;
}

export interface SessionSidebarProps {
  currentSessionId: string;
  sessions: ChatSession[];
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
} 