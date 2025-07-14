import type { AgentContext } from '@agentuity/sdk';
import type { ChatSession } from './types';

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// API endpoints
const TUTORIAL_API_BASE_URL = 'http://localhost:3201';

/**
 * Tutorial Handler - manages all tutorial-related operations
 * Uses LLM for natural language understanding and intent classification
 */

// Fetch list of available tutorials
export async function getTutorialList(ctx: AgentContext) {
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const tutorials = await response.json();
    
    return {
      type: 'tutorial',
      action: 'list',
      tutorials: tutorials,
      message: 'Here are the available tutorials. Which one would you like to start?'
    };
  } catch (error) {
    ctx.logger.error('Failed to fetch tutorials: %s', error);
    return {
      type: 'tutorial',
      action: 'list',
      error: 'Failed to fetch available tutorials',
      tutorials: []
    };
  }
}

// Use LLM to interpret user's tutorial selection
export async function interpretTutorialSelection(userMessage: string, availableTutorials: any[], ctx: AgentContext) {
  // TODO: Implement LLM-based tutorial selection
  // For now, simple keyword matching as placeholder
  
  const message = userMessage.toLowerCase();
  
  for (const tutorial of availableTutorials) {
    const titleWords = tutorial.title.toLowerCase().split(' ');
    const hasMatch = titleWords.some((word: string) => message.includes(word));
    
    if (hasMatch) {
      ctx.logger.info('Matched tutorial: %s for message: %s', tutorial.id, userMessage);
      return tutorial.id;
    }
  }
  
  return null;
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
        action: 'start',
        tutorialId: tutorial.data.id,
        tutorialTitle: tutorial.data.title,
        currentStep: 1,
        totalSteps: tutorial.data.totalSteps,
        stepTitle: 'Getting Started',
        stepContent: tutorial.data.description,
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

// Navigate to next step
export async function nextTutorialStep(session: ChatSession, ctx: AgentContext, targetStep?: number) {
  if (!session.currentTutorial) {
    return {
      type: 'tutorial',
      action: 'next',
      error: 'No active tutorial. Please start a tutorial first.'
    };
  }

  const currentTutorial = session.currentTutorial;
  const nextStep = targetStep || currentTutorial.currentStep + 1;
  
  if (nextStep > currentTutorial.totalSteps) {
    // Tutorial completed
    currentTutorial.completed = true;
    return {
      type: 'tutorial',
      action: 'next',
      currentStep: currentTutorial.totalSteps,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: 'Tutorial Complete!',
      content: `Congratulations! You've completed the ${currentTutorial.tutorialTitle} tutorial.`,
      instructions: 'You can start a new tutorial or ask me any questions.',
      nextAction: 'reset'
    };
  }

  // Mark previous step as completed
  if (currentTutorial.currentStep > 0) {
    currentTutorial.progress[currentTutorial.currentStep.toString()] = {
      completed: true,
      completedAt: new Date().toISOString()
    };
  }

  // Update current step
  currentTutorial.currentStep = nextStep;

  // Fetch step content from API
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${currentTutorial.tutorialId}/steps/${nextStep}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const stepData = await response.json() as any;

    return {
      type: 'tutorial',
      action: 'next',
      currentStep: nextStep,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: stepData.data.title || `Step ${nextStep}`,
      content: stepData.data.description || stepData.data.readmeContent,
      instructions: nextStep < currentTutorial.totalSteps ? 'Click next to continue.' : 'This is the final step!',
      initialCode: stepData.data.codeContent,
      nextAction: nextStep < currentTutorial.totalSteps ? 'next' : 'complete'
    };
  } catch (error) {
    ctx.logger.error('Failed to fetch step %d for tutorial %s: %s', nextStep, currentTutorial.tutorialId, error);
    
    // Fallback response if API fails
    return {
      type: 'tutorial',
      action: 'next',
      currentStep: nextStep,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: `Step ${nextStep}`,
      content: `This is step ${nextStep} of the ${currentTutorial.tutorialTitle} tutorial.`,
      instructions: nextStep < currentTutorial.totalSteps ? 'Click next to continue.' : 'This is the final step!',
      nextAction: nextStep < currentTutorial.totalSteps ? 'next' : 'complete',
      error: 'Failed to load step content'
    };
  }
}

// Navigate to previous step
export async function previousTutorialStep(session: ChatSession, ctx: AgentContext, targetStep?: number) {
  if (!session.currentTutorial) {
    return {
      type: 'tutorial',
      action: 'previous',
      error: 'No active tutorial. Please start a tutorial first.'
    };
  }

  const currentTutorial = session.currentTutorial;
  const prevStep = targetStep || Math.max(1, currentTutorial.currentStep - 1);
  
  // Update current step
  currentTutorial.currentStep = prevStep;

  // Fetch step content from API
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${currentTutorial.tutorialId}/steps/${prevStep}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const stepData = await response.json() as any;

    return {
      type: 'tutorial',
      action: 'previous',
      currentStep: prevStep,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: stepData.data.title || `Step ${prevStep}`,
      content: stepData.data.description || stepData.data.readmeContent,
      instructions: 'Navigate forward or backward through the tutorial.',
      initialCode: stepData.data.codeContent,
      nextAction: 'next'
    };
  } catch (error) {
    ctx.logger.error('Failed to fetch step %d for tutorial %s: %s', prevStep, currentTutorial.tutorialId, error);
    
    // Fallback response if API fails
    return {
      type: 'tutorial',
      action: 'previous',
      currentStep: prevStep,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: `Step ${prevStep}`,
      content: `This is step ${prevStep} of the ${currentTutorial.tutorialTitle} tutorial.`,
      instructions: 'Navigate forward or backward through the tutorial.',
      nextAction: 'next',
      error: 'Failed to load step content'
    };
  }
}
