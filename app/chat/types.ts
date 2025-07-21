// Message types
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlock?: CodeBlock;
  execution?: ExecutionResult;
}

export interface CodeBlock {
  filename: string;
  content: string;
  language: string;
  editable: boolean;
}

export interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  exitCode: number;
  success?: boolean;
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

export interface CreateSessionResponse {
  sessionId: string;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
}

// New agent response types that match the backend
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorialStep {
  title: string;
  content: string;
  instructions: string;
  initialCode?: string;
  totalSteps: number;
}

export interface TutorialData {
  tutorialId: string;
  currentStep: number;
  tutorialStep: TutorialStep;
}

export interface AgentResponse {
  response: string;
  conversationHistory: ConversationMessage[];
  tutorialData?: TutorialData;
  error?: string;
  details?: string;
}

// Execution stream event types
export type ExecutionEventType = 
  | 'status' 
  | 'stdout' 
  | 'stderr' 
  | 'close' 
  | 'timeout' 
  | 'error';

export interface ExecutionEvent {
  type: ExecutionEventType;
  data?: string;
  message?: string;
  exitCode?: number;
  error?: string;
  timestamp: string;
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

export interface CodeBlockProps {
  filename: string;
  content: string;
  language: string;
  editable: boolean;
  onExecute: (code: string, filename: string) => Promise<void>;
  onCodeChange: (code: string) => void;
  executionResult?: ExecutionResult;
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

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
} 