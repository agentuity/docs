import { ExecuteRequest } from '../types';

// Agent endpoints
const AGENT_PULSE_URL = 'http://127.0.0.1:3500/agent_ddcb59aa4473f1323be5d9f5fb62b74e';

export interface TutorialRequestParams {
  action: string;
  tutorialId?: string;
  sessionId: string;
}

export interface ChatRequestParams {
  message: string;
  sessionId: string;
}

export interface ExecuteRequestParams extends ExecuteRequest {
  tutorialId?: string;
  stepId?: string;
}

export interface ServerStatusResponse {
  running: boolean;
  pid: number | null;
  idleTimeMs: number;
  timeoutMs: number;
}

export const apiService = {
  /**
   * Send a chat message to the agent
   */
  sendChatMessage: async (params: ChatRequestParams): Promise<any> => {
    const response = await fetch(AGENT_PULSE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chat',
        message: params.message,
        sessionId: params.sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message to agent');
    }

    return response.json();
  },

  /**
   * Execute code and return a stream for processing
   */
  executeCode: async (params: ExecuteRequestParams): Promise<ReadableStream<Uint8Array>> => {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to execute code');
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    return response.body;
  },

  /**
   * Check the status of the server
   */
  checkServerStatus: async (sessionId: string): Promise<ServerStatusResponse> => {
    const response = await fetch(`/api/execute?sessionId=${sessionId}`);

    if (!response.ok) {
      throw new Error('Failed to check server status');
    }

    return response.json();
  },

  /**
   * Stop a running server
   */
  stopServer: async (sessionId: string): Promise<void> => {
    const response = await fetch(`/api/execute?sessionId=${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to stop server: ${error.message}`);
    }
  }
}; 