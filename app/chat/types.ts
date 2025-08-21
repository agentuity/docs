// Core message type
export interface Message {
  id: string;
  author: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: string;
  tutorialData?: TutorialData;
}

// Tutorial data type
export interface TutorialData {
  tutorialId: string;
  totalStep: number;
  currentStep: number;
  tutorialStep: {
    title: string;
    readmeContent: string;
    instructions: string;
    codeContent?: string;
    totalSteps: number;
  };
}

// Code file type
export interface CodeFile {
  filename: string;
  content: string;
  language: string;
}

// Session type
export interface Session {
  messages: Message[];
  sessionId: string;
}

export interface SessionSidebarProps {
  currentSessionId: string;
  sessions: Session[];
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

// // API request/response types
export interface ExecuteRequest {
  code: string;
  filename: string;
  sessionId: string;
}

// export interface ExecuteResponse {
//   success: boolean;
//   output?: string;
//   error?: string;
//   executionTime?: number;
//   exitCode?: number;
// }

// // Streaming support types
export interface StreamingChunk {
  type: 'text-delta' | 'status' | 'tutorial-data' | 'error' | 'finish';
  textDelta?: string;
  message?: string;
  category?: string;
  tutorialData?: TutorialData;
  error?: string;
  details?: string;
}

// // Agent request type
// export interface AgentStreamingRequest {
//   message: string;
//   conversationHistory: Message[];
//   tutorialData?: TutorialData;
// }

// export interface ChatMessageProps {
//   message: Message;
//   onCodeExecute: (code: string, filename: string) => Promise<void>;
//   onCodeChange: (code: string, filename: string) => void;
//   executionState: ExecutionState;
// }

// export type ExecutionState = 'idle' | 'running' | 'completed' | 'error';

