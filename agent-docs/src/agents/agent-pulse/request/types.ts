export interface ConversationMessage {
  author: "USER" | "ASSISTANT";
  content: string;
}

export interface TutorialState {
  tutorialId: string;
  currentStep: number;
}

export interface ParsedAgentRequest {
  message: string;
  conversationHistory: ConversationMessage[];
  tutorialData?: TutorialState;
  useDirectLLM?: boolean;
  userId?: string;
}