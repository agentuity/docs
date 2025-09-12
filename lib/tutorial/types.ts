// Tutorial state management types

export interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
}

export interface UserTutorialState {
  userId: string;
  tutorials: {
    [tutorialId: string]: TutorialProgress;
  };
}

// Simple state for agent communication (matches existing agent types)
export interface TutorialState {
  tutorialId: string;
  currentStep: number;
}
