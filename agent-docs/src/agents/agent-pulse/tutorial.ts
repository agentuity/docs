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
  stepNumber: number;
  slug: string;
  meta: Record<string, unknown>;
  mdx: string;
  snippets: TutorialSnippet[];
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
    // New behavior: fetch all, then find by id
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials`);
    if (!response.ok) {
      const error = `Failed to fetch tutorial list: ${response.statusText}`;
      ctx.logger.error(error);
      return { success: false, status: response.status, error: response.statusText };
    }
    const tutorials = (await response.json()) as Tutorial[];
    const found = tutorials.find(t => t.id === tutorialId);
    if (!found) {
      return { success: false, status: 404, error: 'Tutorial not found' };
    }
    return { success: true, data: found };
  } catch (error) {
    ctx.logger.error('Error fetching tutorial metadata for %s: %s', tutorialId, error);
    throw error;
  }
}

export async function getTutorialStep(tutorialId: string, stepNumber: number, ctx: AgentContext): Promise<ApiResponse<TutorialStepResponseData>> {
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${tutorialId}/steps/${stepNumber}`);

    if (!response.ok) {
      ctx.logger.error('Failed to fetch tutorial step %d for tutorial %s: %s', stepNumber, tutorialId, response.statusText);
      return { success: false, status: response.status, error: response.statusText };
    }

    const responseData = await response.json();
    ctx.logger.info('Fetched step %d for tutorial %s', stepNumber, tutorialId);

    return responseData as ApiResponse<TutorialStepResponseData>;
  } catch (error) {
    ctx.logger.error('Error fetching tutorial step %d for tutorial %s: %s', stepNumber, tutorialId, error);
    throw error;
  }
}