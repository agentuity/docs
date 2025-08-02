// Message types
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlock?: CodeBlock;
}

export interface CodeBlock {
  filename: string;
  content: string;
  language: string;
  editable: boolean;
}

// Session types
export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  currentFiles: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

// API request/response types
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


export interface TutorialStep {
  title: string;
  readmeContent: string;
  instructions: string;
  codeContent?: string;
  totalSteps: number;
}

export interface TutorialData {
  tutorialId: string;
  currentStep: number;
  tutorialStep: TutorialStep;
}

// Streaming support types
export interface StreamingChunk {
  type: 'text-delta' | 'status' | 'tutorial-data' | 'error' | 'finish';
  textDelta?: string;
  message?: string;
  category?: string;
  tutorialData?: TutorialData;
  error?: string;
  details?: string;
}

// New agent response types that match the backend
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentStreamingRequest {
  message: string;
  conversationHistory: ConversationMessage[];
  tutorialData?: TutorialData;
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
  executionState: ExecutionState;
}

export type ExecutionState = 'idle' | 'running' | 'completed' | 'error';

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