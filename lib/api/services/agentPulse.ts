/**
 * Agent Pulse Service
 * Handles communication with the agent-pulse streaming endpoint
 */

import { config } from '@/lib/config';

interface ConversationMessage {
  author: 'USER' | 'ASSISTANT';
  content: string;
}

interface TutorialState {
  tutorialId: string;
  currentStep: number;
}

export interface AgentPulseRequest {
  message: string;
  conversationHistory?: ConversationMessage[];
  tutorialData?: TutorialState;
}

export interface StreamingChunk {
  type: 'text-delta' | 'status' | 'tutorial-data' | 'finish' | 'error';
  textDelta?: string;
  message?: string;
  category?: string;
  tutorialData?: any;
  error?: string;
  details?: string;
}

export interface AgentPulseCallbacks {
  onTextDelta?: (text: string) => void;
  onStatus?: (message: string, category?: string) => void;
  onTutorialData?: (data: any) => void;
  onFinish?: () => void;
  onError?: (error: string) => void;
}

const AGENT_PULSE_TIMEOUT = 30000; // 30 seconds

/**
 * Call agent-pulse endpoint with streaming response
 * Processes SSE events and calls appropriate callbacks
 */
export async function callAgentPulseStreaming(
  payload: AgentPulseRequest,
  callbacks: AgentPulseCallbacks
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (process.env.AGENT_BEARER_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.AGENT_BEARER_TOKEN}`;
    }

    const url = `${config.agentBaseUrl}/api/agent_pulse`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AGENT_PULSE_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[agentPulse] Error response:', errorText);
        throw new Error(`Agent responded with status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body from agent');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const decoded = decoder.decode(value, { stream: true });
        buffer += decoded;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const chunk = JSON.parse(jsonStr) as StreamingChunk;

              if (chunk.type === 'text-delta' && chunk.textDelta) {
                callbacks.onTextDelta?.(chunk.textDelta);
              } else if (chunk.type === 'status') {
                callbacks.onStatus?.(chunk.message || '', chunk.category);
              } else if (chunk.type === 'tutorial-data' && chunk.tutorialData) {
                callbacks.onTutorialData?.(chunk.tutorialData);
              } else if (chunk.type === 'finish') {
                callbacks.onFinish?.();
              } else if (chunk.type === 'error') {
                callbacks.onError?.(chunk.error || 'Unknown error');
              }
            } catch (error) {
              console.error('[agentPulse] Error parsing SSE chunk:', error);
            }
          }
        }
      }

      // Process any remaining data
      if (buffer.length > 0 && buffer.startsWith('data: ')) {
        try {
          const chunk = JSON.parse(buffer.slice(6)) as StreamingChunk;
          if (chunk.type === 'text-delta' && chunk.textDelta) {
            callbacks.onTextDelta?.(chunk.textDelta);
          } else if (chunk.type === 'finish') {
            callbacks.onFinish?.();
          }
        } catch (error) {
          console.error('Error parsing final SSE chunk:', error);
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[agentPulse] call failed:', message);
    callbacks.onError?.(message);
  }
}

// Alias for backwards compatibility
export const agentPulseService = {
  callStreaming: callAgentPulseStreaming,
};
