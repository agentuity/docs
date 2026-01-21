/**
 * Agent QA Service
 * Handles communication with the doc-qa agent
 */

import { apiRequest } from '../client';
import { ApiError } from '../types';
import { config } from '@/lib/config';

interface AgentQaRequest {
  message: string;
}

interface DocumentReference {
  url: string;
  title: string;
}

interface AgentQaResponse {
  answer: string;
  documents?: DocumentReference[];
}

const AGENT_QA_TIMEOUT = 30000; // 30 seconds
const AGENT_QA_ENDPOINT = '/api/doc-qa';

/**
 * Log actionable error information without exposing secrets
 */
function logAgentQaError(error: unknown): void {
  const baseUrl = config.agentBaseUrl;
  const fullEndpoint = `${baseUrl}${AGENT_QA_ENDPOINT}`;
  const hasBearerToken = !!process.env.AGENT_BEARER_TOKEN;

  console.error('[agentQa] Failed to communicate with doc-qa agent');
  console.error('[agentQa] Endpoint:', fullEndpoint);
  console.error('[agentQa] Bearer token configured:', hasBearerToken);

  if (error instanceof ApiError) {
    console.error('[agentQa] Status code:', error.status);
    console.error('[agentQa] Error message:', error.message);

    if (error.status === 408) {
      console.error(`[agentQa] Action: Request timed out after ${AGENT_QA_TIMEOUT}ms. Check if the doc-qa agent is running and responsive.`);
    } else if (error.status === 401 || error.status === 403) {
      console.error('[agentQa] Action: Authentication failed. Verify AGENT_BEARER_TOKEN is correctly set.');
    } else if (error.status === 404) {
      console.error('[agentQa] Action: Endpoint not found. Verify AGENT_BASE_URL is correct and the doc-qa agent is deployed.');
    } else if (error.status >= 500) {
      console.error('[agentQa] Action: Server error from doc-qa agent. Check agent logs for details.');
    } else {
      console.error('[agentQa] Action: Unexpected error. Check agent configuration and connectivity.');
    }
  } else if (error instanceof Error) {
    console.error('[agentQa] Error type:', error.name);
    console.error('[agentQa] Error message:', error.message);

    if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED') || error.message.includes('network')) {
      console.error('[agentQa] Action: Network error. Verify AGENT_BASE_URL is reachable and the doc-qa agent is running.');
    } else {
      console.error('[agentQa] Action: Unexpected error occurred. Review the error details above.');
    }
  } else {
    console.error('[agentQa] Unknown error:', error);
    console.error('[agentQa] Action: An unexpected error occurred. Check agent configuration.');
  }
}

/**
 * Query the doc-qa agent for answers and related documents
 */
export async function queryAgentQa(message: string): Promise<AgentQaResponse> {
  try {
    const response = await apiRequest<AgentQaResponse>(
      AGENT_QA_ENDPOINT,
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
    logAgentQaError(error);
    throw error;
  }
}

// Alias for backwards compatibility if needed
export const agentQaService = {
  query: queryAgentQa,
};
