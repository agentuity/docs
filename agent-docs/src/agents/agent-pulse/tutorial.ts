import type { AgentContext } from '@agentuity/sdk';
import type { ChatSession } from './types';

const TUTORIAL_API_BASE_URL = 'http://localhost:3201';

interface Tutorial {
  id: string | number;
  title: string;
  description: string;
  totalSteps: number;
}

export async function getTutorialList(ctx: AgentContext): Promise<Tutorial[]> {
  const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials`);

  if (!response.ok) {
    const error = await response.json();
    ctx.logger.error('Tutorial API error: %s', error);
    throw new Error(`Tutorial API error: ${JSON.stringify(error)}`);
  }

  const tutorials = await response.json() as Tutorial[];
  ctx.logger.info('Fetched %d tutorials', tutorials.length);
  
  return tutorials;
}

// Start a specific tutorial
export async function startTutorial(tutorialId: string, session: ChatSession, ctx: AgentContext) {
  try {
    // Fetch specific tutorial details
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${tutorialId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const tutorial = await response.json() as any;

    // Update session with tutorial state
    session.currentTutorial = {
      tutorialId: tutorial.data.id,
      tutorialTitle: tutorial.data.title,
      currentStep: 1,
      totalSteps: tutorial.data.totalSteps,
      startedAt: new Date().toISOString(),
      completed: false,
      progress: {}
    };

    // Fetch detailed first step content
    try {
      const stepResponse = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${tutorial.data.id}/steps/1`);
      if (!stepResponse.ok) {
        throw new Error(`HTTP error! status: ${stepResponse.status}`);
      }
      const stepData = await stepResponse.json() as any;
      return {
        type: 'tutorial',
        action: 'start',
        tutorialId: tutorial.data.id,
        tutorialTitle: tutorial.data.title,
        currentStep: 1,
        totalSteps: tutorial.data.totalSteps,
        stepTitle: stepData.data.title,
        stepContent: stepData.data.description || stepData.data.readmeContent,
        instructions: 'Click next to continue to the next step.',
        initialCode: stepData.data.codeContent,
        nextAction: 'next'
      };
    } catch (stepError) {
      ctx.logger.error('Failed to fetch first step details for tutorial %s: %s', tutorial.data.id, stepError);

      // Fallback to basic tutorial info
      return {
        type: 'tutorial',
        instructions: 'Click next to continue to the next step.',
        nextAction: 'next',
        error: 'Failed to load detailed step content'
      };
    }
  } catch (error) {
    ctx.logger.error('Failed to start tutorial %s: %s', tutorialId, error);
    return {
      type: 'tutorial',
      action: 'start',
      error: `Failed to start tutorial: ${tutorialId}`,
      fallback: 'Please try selecting a tutorial from the available list.'
    };
  }
}
