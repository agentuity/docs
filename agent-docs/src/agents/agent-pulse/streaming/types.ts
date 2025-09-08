export interface TextDeltaChunk {
  type: 'text-delta';
  textDelta: string;
}

export interface StatusChunk {
  type: 'status';
  message: string;
  category?: 'tool' | 'search' | 'processing';
}

export interface TutorialSnippet {
  path: string;
  lang?: string;
  from?: number;
  to?: number;
  title?: string;
  content: string;
}

export interface TutorialData {
  tutorialId: string;
  totalStep: number;
  currentStep: number;
  tutorialStep: {
    title: string;
    mdx: string;
    snippets: TutorialSnippet[];
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