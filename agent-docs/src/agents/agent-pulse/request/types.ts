export interface ConversationMessage {
  author: "USER" | "ASSISTANT";
  content: string;
}

export interface TutorialState {
  tutorialId: string;
  currentStep: number;
}

export interface AgentRequestData {
  message: string;
  conversationHistory: ConversationMessage[];
  tutorialData?: TutorialState;
}

export interface ParsedAgentRequest {
  message: string;
  conversationHistory: ConversationMessage[];
  tutorialData?: TutorialState;
  useDirectLLM?: boolean;
}