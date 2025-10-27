import type { ConversationMessage } from '../../doc-qa/types';

export type { ConversationMessage };

export interface TutorialState {
  tutorialId: string;
  currentStep: number;
}

export interface ParsedAgentRequest {
  message: string;
  conversationHistory: ConversationMessage[];
  tutorialData?: TutorialState;
  useDirectLLM?: boolean;
}
