/**
 * Agent QA Service
 * Handles communication with the doc-qa agent
 */

import { apiRequest } from '../client';

interface AgentQaRequest {
  message: string;
}

interface AgentQaResponse {
  answer: string;
  documents?: string[];
}

const AGENT_QA_TIMEOUT = 30000; // 30 seconds

/**
 * Query the doc-qa agent for answers and related documents
 */
export async function queryAgentQa(message: string): Promise<AgentQaResponse> {
  try {
    const response = await apiRequest<AgentQaResponse>(
      '/api/doc-qa',
      {
        method: 'POST',
        body: { message },
        timeout: AGENT_QA_TIMEOUT,
      },
      undefined, // use default baseUrl from config
      process.env.AGENT_BEARER_TOKEN
    );

    return response;
  } catch (error) {
    console.error('[agentQa] call failed:', error);
    throw error;
  }
}

// Alias for backwards compatibility if needed
export const agentQaService = {
  query: queryAgentQa,
};
