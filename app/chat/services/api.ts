import { ChatMessage, ExecuteRequest, ChatSession } from '../types';

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
  },
};

// Storage service for persistent data
export const storageService = {
  /**
   * Get all chat sessions from local storage
   */
  getSessions(): ChatSession[] {
    try {
      const sessions = localStorage.getItem('agentuity-chat-sessions');
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  },

  /**
   * Save a chat session to local storage
   */
  saveSession(session: ChatSession): void {
    try {
      const sessions = this.getSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.unshift(session);
      }
      
      localStorage.setItem('agentuity-chat-sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  /**
   * Save all chat sessions to local storage
   */
  saveSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem('agentuity-chat-sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  },

  /**
   * Delete a chat session from local storage
   */
  deleteSession(sessionId: string): void {
    try {
      const sessions = this.getSessions();
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem('agentuity-chat-sessions', JSON.stringify(updatedSessions));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  },

  /**
   * Get user preferences from local storage
   */
  getPreference<T>(key: string, defaultValue: T): T {
    try {
      const value = localStorage.getItem(`agentuity-pref-${key}`);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error(`Failed to load preference ${key}:`, error);
      return defaultValue;
    }
  },

  /**
   * Save user preferences to local storage
   */
  savePreference<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`agentuity-pref-${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save preference ${key}:`, error);
    }
  }
}; 