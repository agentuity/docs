/**
 * Title Generator Service
 * Handles session title generation via the title-generator API
 */

import { apiRequest } from '../client';

interface ConversationMessage {
  author: 'USER' | 'ASSISTANT';
  content: string;
}

interface TitleGeneratorResponse {
  title: string;
}

const TITLE_GEN_TIMEOUT = 3000; // 3 seconds for title generation

/**
 * Generate a title from conversation history
 */
export async function generateTitle(conversationHistory: ConversationMessage[]): Promise<string> {
  try {
    const response = await apiRequest<TitleGeneratorResponse>(
      '/api/title-generator',
      {
        method: 'POST',
        body: { conversationHistory },
        timeout: TITLE_GEN_TIMEOUT,
      }
    );

    return response.title || 'New chat';
  } catch (error) {
    console.error('[title-gen] failed:', error);
    // Return default on error - don't break the flow
    return 'New chat';
  }
}

// Alias for backwards compatibility if needed
export const titleGeneratorService = {
  generate: generateTitle,
};
