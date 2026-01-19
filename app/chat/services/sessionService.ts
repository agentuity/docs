import type { Session, Message, TutorialData, Source } from '../types';

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

export interface ConversationMessage {
  author: 'USER' | 'ASSISTANT';
  content: string;
}

export class SessionService {
  /**
   * Get a page of sessions
   */
  async getSessionsPage(params: { cursor?: number; limit?: number } = {}): Promise<SessionServiceResponse<SessionsPage>> {
    const { cursor = 0, limit = 10 } = params;
    try {
      const response = await fetch(`/api/sessions?cursor=${cursor}&limit=${limit}`, {
        credentials: 'include'
      });
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
      const response = await fetch('/api/sessions', {
        credentials: 'include'
      });
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
      const response = await fetch(`/api/sessions/${sessionId}`, {
        credentials: 'include'
      });
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
        credentials: 'include',
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
        credentials: 'include',
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
        method: 'DELETE',
        credentials: 'include'
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
   * Add a message to a session (JSON response, no streaming)
   * This just saves the user message to the session
   */
  async addMessage(
    sessionId: string,
    message: Message
  ): Promise<SessionServiceResponse<Session>> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        // Try to parse JSON error, fallback to status text
        try {
          const data = await response.json();
          return {
            success: false,
            error: data.error || `Failed to add message: ${response.status}`
          };
        } catch {
          return {
            success: false,
            error: `Failed to add message: ${response.status} ${response.statusText}`
          };
        }
      }

      const data = await response.json();
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
   * Stream agent response from the agent_pulse endpoint
   * This handles the AI streaming and session persistence
   */
  async streamAgentResponse(
    sessionId: string,
    message: string,
    conversationHistory: ConversationMessage[],
    callbacks: {
      onTextDelta?: (text: string) => void,
      onTutorialData?: (tutorialData: TutorialData) => void,
      onSources?: (sources: Source[]) => void,
      onFinish?: (session: Session) => void,
      onError?: (error: string) => void
    }
  ): Promise<void> {
    try {
      const response = await fetch('/api/agent_pulse', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          sessionId,
          conversationHistory
        })
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
              } else if (data.type === 'sources' && data.sources) {
                callbacks.onSources?.(data.sources);
              } else if (data.type === 'finish') {
                // AI done streaming - session comes in session-saved event
              } else if (data.type === 'session-saved') {
                if (data.session) {
                  callbacks.onFinish?.(data.session);
                }
              } else if (data.type === 'error') {
                callbacks.onError?.(data.error || 'Unknown error');
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
              } else if (data.type === 'sources' && data.sources) {
                callbacks.onSources?.(data.sources);
              } else if (data.type === 'finish') {
                // AI done streaming - session comes in session-saved event
              } else if (data.type === 'session-saved') {
                if (data.session) {
                  callbacks.onFinish?.(data.session);
                }
              } else if (data.type === 'error') {
                callbacks.onError?.(data.error || 'Unknown error');
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

  /**
   * @deprecated Use addMessage() + streamAgentResponse() instead
   * Legacy method for backwards compatibility during migration
   */
  async addMessageToSessionStreaming(
    sessionId: string,
    message: Message,
    callbacks: {
      onTextDelta?: (text: string) => void,
      onTutorialData?: (tutorialData: TutorialData) => void,
      onSources?: (sources: Source[]) => void,
      onFinish?: (session: Session) => void,
      onError?: (error: string) => void
    }
  ): Promise<void> {
    // First save the message
    const saveResult = await this.addMessage(sessionId, message);
    if (!saveResult.success) {
      callbacks.onError?.(saveResult.error || 'Failed to save message');
      return;
    }

    // Then stream the agent response
    // Get conversation history from the saved session
    const conversationHistory: ConversationMessage[] = (saveResult.data?.messages || [])
      .slice(-10)
      .map(m => ({
        author: m.author,
        content: m.content
      }));

    await this.streamAgentResponse(
      sessionId,
      message.content,
      conversationHistory,
      callbacks
    );
  }
}

// Export singleton instance
export const sessionService = new SessionService();
