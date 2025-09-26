import type { AgentContext } from '@agentuity/sdk';

const TUTORIAL_API_BASE_URL = process.env.TUTORIAL_API_URL;

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  totalSteps: number;
  difficulty?: string;
  estimatedTime?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  status?: number;
}

export interface TutorialSnippet {
  path: string;
  lang?: string;
  from?: number;
  to?: number;
  title?: string;
  content: string;
}

interface TutorialStepResponseData {
  tutorialId: string;
  totalSteps: number;
  currentStep: number;
  tutorialStep: {
    title: string;
    mdx: string;
    snippets: TutorialSnippet[];
    totalSteps: number;
    estimatedTime?: string;
  };
}

export async function getTutorialList(ctx: AgentContext): Promise<ApiResponse<Tutorial[]>> {
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText })) as { error?: string; details?: any };
      ctx.logger.error('Tutorial API error: %s', JSON.stringify(errorData));
      return {
        success: false,
        status: response.status,
        error: errorData.error || response.statusText,
        details: errorData.details
      };
    }

    const tutorials = await response.json() as Tutorial[];
    ctx.logger.info('Fetched %d tutorials', tutorials.length);

    return {
      success: true,
      data: tutorials
    };
  } catch (error) {
    ctx.logger.error('Error fetching tutorial list: %s', error);
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function getTutorialMeta(tutorialId: string, ctx: AgentContext): Promise<ApiResponse<Tutorial>> {
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${tutorialId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText })) as { error?: string; details?: any };
      ctx.logger.error('Failed to fetch tutorial %s: %s', tutorialId, JSON.stringify(errorData));
      return {
        success: false,
        status: response.status,
        error: errorData.error || response.statusText,
        details: errorData.details
      };
    }

    const responseData = await response.json() as ApiResponse<{
      id: string;
      metadata: {
        title: string;
        description: string;
        totalSteps: number;
        difficulty?: string;
        estimatedTime?: string;
      };
      fullContent: string;
      steps: Array<{ stepNumber: number; title: string; estimatedTime?: string; }>;
    }>;
    
    if (!responseData.success || !responseData.data) {
      return {
        success: false,
        error: responseData.error || 'Invalid response format'
      };
    }

    // Convert to Tutorial format for backward compatibility
    const tutorial: Tutorial = {
      id: responseData.data.id,
      title: responseData.data.metadata.title,
      description: responseData.data.metadata.description,
      totalSteps: responseData.data.metadata.totalSteps,
      difficulty: responseData.data.metadata.difficulty,
      estimatedTime: responseData.data.metadata.estimatedTime
    };

    ctx.logger.info('Fetched tutorial metadata for %s', tutorialId);
    return { success: true, data: tutorial };
  } catch (error) {
    ctx.logger.error('Error fetching tutorial metadata for %s: %s', tutorialId, error);
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function getTutorialStep(tutorialId: string, stepNumber: number, ctx: AgentContext): Promise<ApiResponse<TutorialStepResponseData>> {
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${tutorialId}/steps/${stepNumber}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText })) as { error?: string; details?: any };
      ctx.logger.error('Failed to fetch tutorial step %d for tutorial %s: %s', stepNumber, tutorialId, JSON.stringify(errorData));
      return {
        success: false,
        status: response.status,
        error: errorData.error || response.statusText,
        details: errorData.details
      };
    }

    const responseData = await response.json() as ApiResponse<TutorialStepResponseData>;
    
    if (!responseData.success || !responseData.data) {
      return {
        success: false,
        error: responseData.error || 'Invalid response format'
      };
    }

    ctx.logger.info('Fetched step %d for tutorial %s', stepNumber, tutorialId);
    return responseData;
  } catch (error) {
    ctx.logger.error('Error fetching tutorial step %d for tutorial %s: %s', stepNumber, tutorialId, error);
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}