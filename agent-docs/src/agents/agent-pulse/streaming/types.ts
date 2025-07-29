export interface TextDeltaChunk {
  type: 'text-delta';
  textDelta: string;
}

export interface StatusChunk {
  type: 'status';
  message: string;
  category?: 'tool' | 'search' | 'processing';
}

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

export interface TutorialDataChunk {
  type: 'tutorial-data';
  tutorialData: TutorialData;
}

export interface ErrorChunk {
  type: 'error';
  error: string;
  details?: string;
}

export interface FinishChunk {
  type: 'finish';
}

export type StreamingChunk = TextDeltaChunk | StatusChunk | TutorialDataChunk | ErrorChunk | FinishChunk; 