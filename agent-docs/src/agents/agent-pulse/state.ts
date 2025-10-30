enum ActionType {
  START_TUTORIAL_STEP = "start_tutorial_step"
}

interface Action {
  type: ActionType;
  tutorialId: string;
  currentStep: number;
  totalSteps: number;
}

interface AgentState {
  action: Action | null;
  documentationReferences: string[];

  setAction(action: Action): void;
  getAction(): Action | null;
  clearAction(): void;
  hasAction(): boolean;
  setDocumentationReferences(docs: string[]): void;
  getDocumentationReferences(): string[];
}

class SimpleAgentState implements AgentState {
  public action: Action | null = null;
  public documentationReferences: string[] = [];

  setAction(action: Action): void {
    this.action = action;
  }

  getAction(): Action | null {
    return this.action;
  }

  clearAction(): void {
    this.action = null;
  }

  hasAction(): boolean {
    return this.action !== null;
  }

  setDocumentationReferences(docs: string[]): void {
    this.documentationReferences = docs;
  }

  getDocumentationReferences(): string[] {
    return this.documentationReferences;
  }
}

export function createAgentState(): AgentState {
  return new SimpleAgentState();
}

export type { Action, AgentState };
export { ActionType }; 