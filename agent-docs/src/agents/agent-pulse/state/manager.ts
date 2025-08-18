import type { AgentContext } from "@agentuity/sdk";
import { ActionType, type AgentState } from "../state";
import { getTutorialStep } from "../tutorial";
import type { TutorialData } from "../streaming/types";

export async function handleTutorialState(
  state: AgentState,
  ctx: AgentContext
): Promise<TutorialData | null> {
  try {
    if (!state.hasAction()) {
      return null;
    }

    const action = state.getAction();
    if (!action) {
      ctx.logger.warn("No action found in state");
      return null;
    }

    ctx.logger.info("Processing action: %s", JSON.stringify(action, null, 2));

    switch (action.type) {
      case ActionType.START_TUTORIAL_STEP:
        if (action.tutorialId) {
          const tutorialStep = await getTutorialStep(action.tutorialId, action.currentStep, ctx);
          if (tutorialStep.success && tutorialStep.data) {
            const tutorialData: TutorialData = {
              tutorialId: action.tutorialId,
              totalStep: action.totalSteps,
              currentStep: action.currentStep,
              tutorialStep: {
                title: tutorialStep.data.title,
                readmeContent: tutorialStep.data.readmeContent,
                instructions: tutorialStep.data.description,
                codeContent: tutorialStep.data.codeContent,
                totalSteps: action.totalSteps
              }
            };
            state.clearAction();
            ctx.logger.info("Tutorial state processed successfully");
            return tutorialData;
          }
        }
        break;
      default:
        ctx.logger.warn("Unknown action type: %s", action.type);
    }

    return null;
  } catch (error) {
    ctx.logger.error("Failed to handle tutorial state: %s", error instanceof Error ? error.message : String(error));
    throw error; // Re-throw for centralized handling
  }
} 