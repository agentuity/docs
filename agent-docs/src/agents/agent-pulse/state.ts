interface Action {
  type: "start_tutorial" | "get_tutorials" | "next_step" | "get_progress";
  tutorialId?: string;
  currentStep?: number;
}

interface AgentState {
  actions: Action[];
  
  addAction(action: Action): void;
  getActions(): Action[];
  clearActions(): void;
}

class SimpleAgentState implements AgentState {
  public actions: Action[] = [];
  
  addAction(action: Action): void {
    this.actions.push(action);
  }
  
  getActions(): Action[] {
    return [...this.actions];
  }
  
  clearActions(): void {
    this.actions = [];
  }
}

export function createAgentState(): AgentState {
  return new SimpleAgentState();
}

export type { Action, AgentState }; 