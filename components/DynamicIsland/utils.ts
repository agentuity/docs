import { Tutorial, TutorialStep } from './types';

/**
 * Creates a sample tutorial for demonstration purposes
 */
export function createSampleTutorial(): Tutorial {
  const steps: TutorialStep[] = [
    {
      id: 'step-1',
      title: 'Welcome to Agentuity',
      description: 'Get started by exploring the platform and understanding how AI agents work. This tutorial will guide you through the key features and concepts.',
      icon: '🤖',
      estimatedTime: '2 min',
      completed: false
    },
    {
      id: 'step-2',
      title: 'Create Your First Agent',
      description: 'Learn how to create and configure your first AI agent. We\'ll walk through the setup process and show you how to customize your agent\'s behavior.',
      icon: '💬',
      estimatedTime: '5 min',
      completed: false
    },
    {
      id: 'step-3',
      title: 'Deploy Your Agent',
      description: 'Deploy your agent to the cloud and make it available to users. We\'ll show you how to monitor performance and handle scaling.',
      icon: '🚀',
      estimatedTime: '3 min',
      completed: false
    },
    {
      id: 'step-4',
      title: 'Monitor & Optimize',
      description: 'Learn how to monitor your agent\'s performance, analyze usage patterns, and optimize for better results. We\'ll cover key metrics and best practices.',
      icon: '📊',
      estimatedTime: '4 min',
      completed: false
    }
  ];

  return {
    id: 'agentuity-onboarding',
    title: 'Agentuity Onboarding',
    currentStep: 0,
    totalSteps: steps.length,
    steps,
    isActive: true
  };
}

/**
 * Creates a tutorial with custom steps
 */
export function createTutorial(
  id: string,
  title: string,
  steps: Omit<TutorialStep, 'completed'>[]
): Tutorial {
  const tutorialSteps: TutorialStep[] = steps.map(step => ({
    ...step,
    completed: false
  }));

  return {
    id,
    title,
    currentStep: 0,
    totalSteps: tutorialSteps.length,
    steps: tutorialSteps,
    isActive: true
  };
}

/**
 * Calculates progress percentage for a tutorial
 */
export function calculateProgress(tutorial: Tutorial): number {
  const completedSteps = tutorial.steps.filter(step => step.completed).length;
  return (completedSteps / tutorial.totalSteps) * 100;
}

/**
 * Checks if a tutorial is completed
 */
export function isTutorialCompleted(tutorial: Tutorial): boolean {
  return tutorial.steps.every(step => step.completed);
}

/**
 * Gets the next incomplete step
 */
export function getNextIncompleteStep(tutorial: Tutorial): TutorialStep | null {
  return tutorial.steps.find(step => !step.completed) || null;
}

/**
 * Creates a tutorial step
 */
export function createTutorialStep(
  id: string,
  title: string,
  description: string,
  icon: string,
  estimatedTime: string
): Omit<TutorialStep, 'completed'> {
  return {
    id,
    title,
    description,
    icon,
    estimatedTime
  };
} 