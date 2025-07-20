enum ActionType {
  START_TUTORIAL_STEP = "start_tutorial_step"
}

interface Action {
  type: ActionType;
  tutorialId: string;
  currentStep: number;
}

interface AgentState {
  action: Action | null;

  setAction(action: Action): void;
  getAction(): Action | null;
  clearAction(): void;
  hasAction(): boolean;
}

class SimpleAgentState implements AgentState {
  public action: Action | null = null;

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
}

export function createAgentState(): AgentState {
  return new SimpleAgentState();
}

export type { Action, AgentState };
export { ActionType }; 