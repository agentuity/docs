export interface RelevantDoc {
    path: string;
    content: string;
}

export enum PromptType {
  Normal = 'Normal',
  Thinking = 'Thinking'
}

export interface PromptClassification {
  type: PromptType;
  confidence: number;
  reasoning: string;
}