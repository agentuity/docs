import type { AgentContext } from '@agentuity/sdk';
import { startTutorial } from './tutorial';

export interface TutorialData {
  type: 'tutorial_step';
  tutorialId: string;
  tutorialTitle: string;
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
  stepContent: string;
  instructions?: string;
  codeBlock?: {
    filename: string;
    content: string;
  };
}

export async function fetchTutorialContent(
  tutorialId: string, 
  ctx: AgentContext
): Promise<TutorialData | null> {
  try {
    // Create a basic session for the tutorial API
    const session = {
      sessionId: `session_${Date.now()}`,
      sessionType: 'tutorial' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      lastActivity: new Date().toISOString(),
      isActive: true
    };

    const tutorialStart = await startTutorial(tutorialId, session, ctx);
    
    ctx.logger.info('Raw tutorial start response: %j', tutorialStart);
    
    // Structure the tutorial data for frontend
    const tutorialData: TutorialData = {
      type: 'tutorial_step',
      tutorialId: tutorialStart.tutorialId,
      tutorialTitle: tutorialStart.tutorialTitle,
      currentStep: tutorialStart.currentStep || 1,
      totalSteps: tutorialStart.totalSteps || 1,
      stepTitle: tutorialStart.stepTitle,
      stepContent: tutorialStart.stepContent,
      instructions: tutorialStart.instructions
    };

    // Add code block if available
    if (tutorialStart.initialCode) {
      tutorialData.codeBlock = {
        filename: 'index.ts', // Default filename
        content: tutorialStart.initialCode
      };
    }

    ctx.logger.info('Final tutorial data being returned: %j', tutorialData);

    return tutorialData;
  } catch (error) {
    ctx.logger.error('Failed to fetch tutorial content for %s: %s', tutorialId, error);
    return null;
  }
} 