import { Session, Message, TutorialData } from '../types';

export interface SessionServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}


export class SessionService {
  /**
   * Get all sessions from API
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
   * Add a message to a session with streaming response support
   */
  async addMessageToSessionStreaming(
    sessionId: string,
    message: Message,
    callbacks: {
      onTextDelta?: (text: string) => void,
      onTutorialData?: (tutorialData: TutorialData) => void,
      onFinish?: (session: Session) => void,
      onError?: (error: string) => void
    }
  ): Promise<void> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'text-delta' && data.textDelta) {
                callbacks.onTextDelta?.(data.textDelta);
              } else if (data.type === 'tutorial-data' && data.tutorialData) {
                callbacks.onTutorialData?.(data.tutorialData);
              } else if (data.type === 'finish' && data.session) {
                callbacks.onFinish?.(data.session);
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }

      // Process any remaining data
      if (buffer.length > 0) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text-delta' && data.textDelta) {
                callbacks.onTextDelta?.(data.textDelta);
              } else if (data.type === 'tutorial-data' && data.tutorialData) {
                callbacks.onTutorialData?.(data.tutorialData);
              } else if (data.type === 'finish' && data.session) {
                callbacks.onFinish?.(data.session);
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService();