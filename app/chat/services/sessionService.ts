import { Session, Message, TutorialData } from '../types';

export interface SessionServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SessionsPage {
  sessions: Session[];
  pagination: {
    cursor: number;
    nextCursor: number | null;
    hasMore: boolean;
    total: number;
    limit: number;
  };
}


export class SessionService {
  /**
   * Get a page of sessions
   */
  async getSessionsPage(params: { cursor?: number; limit?: number } = {}): Promise<SessionServiceResponse<SessionsPage>> {
    const { cursor = 0, limit = 10 } = params;
    try {
      const response = await fetch(`/api/sessions?cursor=${cursor}&limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Failed to fetch sessions: ${response.status}`
        };
      }

      return {
        success: true,
        data: {
          sessions: data.sessions || [],
          pagination: data.pagination || { cursor, nextCursor: null, hasMore: false, total: 0, limit }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all sessions from API (first page fallback)
   */
  async getAllSessions(): Promise<SessionServiceResponse<Session[]>> {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Failed to fetch sessions: ${response.status}`
        };
      }
      return {
        success: true,
        data: data.sessions || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a specific session by ID
   */
  async getSession(sessionId: string): Promise<SessionServiceResponse<Session>> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Session not found'
        };
      }

      return {
        success: true,
        data: data.session
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a new session
   */
  async createSession(session: Session): Promise<SessionServiceResponse<Session>> {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(session)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to create session'
        };
      }

      return {
        success: true,
        data: data.session
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update an existing session
   */
  async updateSession(session: Session): Promise<SessionServiceResponse<Session>> {
    try {
      const response = await fetch(`/api/sessions/${session.sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(session)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to update session'
        };
      }

      return {
        success: true,
        data: data.session
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<SessionServiceResponse<void>> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Failed to delete session'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Regenerate the assistant response for a session
   * - If last message is ASSISTANT: replaces it with new response
   * - If last message is USER: generates new assistant response
   */
  async regenerate(
    sessionId: string,
    callbacks: RegenerateCallbacks,
    abortSignal?: AbortSignal
  ): Promise<void> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        callbacks.onError?.(errorData.error || `Error: ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('No response body available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          lines.forEach(line => processSSELine(line, callbacks));
        }

        buffer.split('\n').forEach(line => processSSELine(line, callbacks));
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Add a message to a session with streaming response support
   */
  async addMessageToSessionStreaming(
    sessionId: string,
    message: Message,
    callbacks: StreamingCallbacks,
    abortSignal?: AbortSignal
  ): Promise<void> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        callbacks.onError?.(errorData.error || `Error: ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('No response body available');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          // Process complete lines
          lines.forEach(line => processSSELine(line, callbacks));
        }

        // Process any remaining buffer
        buffer.split('\n').forEach(line => processSSELine(line, callbacks));
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      // Ignore abort errors - request was intentionally cancelled
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
}

/**
 * Streaming callback types
 */
export interface StreamingCallbacks {
  onTextDelta?: (text: string) => void;
  onTutorialData?: (tutorialData: TutorialData) => void;
  onDocumentationReferences?: (documents: string[]) => void;
  onStatus?: (message: string, category?: string) => void;
  onFinish?: (session: Session) => void;
  onError?: (error: string, details?: string) => void;
}

/**
 * Regenerate callback types
 */
export interface RegenerateCallbacks extends StreamingCallbacks {
  onStart?: (data: { action: 'replace' | 'new'; messageId: string }) => void;
}

/**
 * Process a single SSE line and dispatch to appropriate callback
 * Handles both regular streaming and regenerate callbacks (with onStart support)
 */
function processSSELine(
  line: string,
  callbacks: StreamingCallbacks | RegenerateCallbacks
): void {
  if (!line.startsWith('data: ')) return;

  try {
    const data = JSON.parse(line.slice(6));

    switch (data.type) {
      case 'start':
        // Type guard: check if callbacks has onStart (regenerate callbacks only)
        if ('onStart' in callbacks && callbacks.onStart) {
          callbacks.onStart({ action: data.action, messageId: data.messageId });
        }
        break;
      case 'text-delta':
        if (data.textDelta) callbacks.onTextDelta?.(data.textDelta);
        break;
      case 'tutorial-data':
        if (data.tutorialData) callbacks.onTutorialData?.(data.tutorialData);
        break;
      case 'documentation-references':
        if (data.documents) callbacks.onDocumentationReferences?.(data.documents);
        break;
      case 'status':
        if (data.message) callbacks.onStatus?.(data.message, data.category);
        break;
      case 'error':
        callbacks.onError?.(data.error || 'Unknown error', data.details);
        break;
      case 'finish':
        if (data.session) callbacks.onFinish?.(data.session);
        break;
    }
  } catch (error) {
    console.error('Error parsing SSE data:', error);
  }
}

// Export singleton instance
export const sessionService = new SessionService();