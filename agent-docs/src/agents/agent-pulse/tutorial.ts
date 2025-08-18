import type { AgentContext } from '@agentuity/sdk';

const TUTORIAL_API_BASE_URL = process.env.TUTORIAL_API_URL;

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  totalSteps: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

interface TutorialStep {
  stepNumber: number;
  title: string;
  description: string;
  directory: string;
  readmeContent: string;
  codeContent: string;
}

export async function getTutorialList(ctx: AgentContext): Promise<ApiResponse<Tutorial[]>> {
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials`);

    if (!response.ok) {
      const error = await response.json();
      ctx.logger.error('Tutorial API error: %s', error);
      throw new Error(`Tutorial API error: ${JSON.stringify(error)}`);
    }

    const tutorials = await response.json() as Tutorial[];
    ctx.logger.info('Fetched %d tutorials', tutorials.length);

    return {
      success: true,
      data: tutorials
    };
  } catch (error) {
    ctx.logger.error('Error fetching tutorial list: %s', error);
    throw error;
  }
}

export async function getTutorialMeta(tutorialId: string, ctx: AgentContext): Promise<ApiResponse<Tutorial>> {
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${tutorialId}`);

    if (!response.ok) {
      const error = `Failed to fetch tutorial metadata: ${response.statusText}`;
      ctx.logger.error(error);
      return { success: false, status: response.status, error: response.statusText };
    }

    const tutorialData = await response.json() as ApiResponse<Tutorial>;
    ctx.logger.info("tutorialData: " + JSON.stringify(tutorialData))

    // Check if the API response indicates success
    if (!tutorialData.success) {
      ctx.logger.error('Tutorial API returned error: %s', tutorialData.error);
      return {
        success: false,
        status: tutorialData.status,
        error: tutorialData.error || 'Unknown error from tutorial API'
      };
    }

    // Only proceed if we have valid data
    if (!tutorialData.data) {
      ctx.logger.error('Tutorial API returned success but no data');
      return {
        success: false,
        error: 'No tutorial data received from API'
      };
    }

    const tutorial: Tutorial = {
      id: tutorialData.data.id,
      title: tutorialData.data.title,
      description: tutorialData.data.description,
      totalSteps: tutorialData.data.totalSteps
    };

    return { success: true, data: tutorial };
  } catch (error) {
    ctx.logger.error('Error fetching tutorial metadata for %s: %s', tutorialId, error);
    throw error;
  }
}

export async function getTutorialStep(tutorialId: string, stepNumber: number, ctx: AgentContext): Promise<ApiResponse<TutorialStep>> {
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${tutorialId}/steps/${stepNumber}`);

    if (!response.ok) {
      ctx.logger.error('Failed to fetch tutorial step %d for tutorial %s: %s', stepNumber, tutorialId, response.statusText);
      return { success: false, status: response.status, error: response.statusText };
    }

    const responseData = await response.json();
    ctx.logger.info('Fetched step %d for tutorial %s', stepNumber, tutorialId);

    return responseData as ApiResponse<TutorialStep>;
  } catch (error) {
    ctx.logger.error('Error fetching tutorial step %d for tutorial %s: %s', stepNumber, tutorialId, error);
    throw error;
  }
}