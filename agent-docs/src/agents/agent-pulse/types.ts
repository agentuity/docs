// Session management types
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface TutorialProgress {
  [stepNumber: string]: {
    completed: boolean;
    completedAt?: string;
    userCode?: string;     // if they modified code in a step
    executionResults?: any; // results from running their code
  };
}

export interface CurrentTutorial {
  tutorialId: string;        // e.g., "typescript-sdk-tutorial" 
  tutorialTitle: string;     // e.g., "TypeScript SDK Tutorial"
  currentStep: number;       // current step number (1-based)
  totalSteps: number;        // total steps in tutorial
  startedAt: string;
  completed: boolean;
  progress: TutorialProgress;
}

export interface UserProfile {
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  completedTutorials?: string[]; // array of completed tutorial IDs
}

export interface ChatSession {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  
  // Conversation history for context (keep last 50 messages for performance)
  messages: ChatMessage[];
  
  // Tutorial state
  currentTutorial?: CurrentTutorial;
  
  // User context
  userProfile?: UserProfile;
  
  // Session metadata
  lastActivity: string;
  isActive: boolean;
}

// Request types using discriminated union
export interface ChatRequest {
  type: 'chat';
  message: string;
  sessionId?: string; // Optional, will be generated if not provided
}

export interface TutorialRequest {
  type: 'tutorial';
  action: 'start' | 'next' | 'previous' | 'reset' | 'list';
  sessionId?: string; // Optional, will be generated if not provided
  step?: number; // Optional for navigation to specific steps
  tutorialId?: string; // For starting a specific tutorial
}

export type AgentRequestData = ChatRequest | TutorialRequest; 