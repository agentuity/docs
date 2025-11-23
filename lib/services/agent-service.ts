/**
 * Agent Service
 *
 * Handles communication with the agent (AgentPulse) including
 * streaming responses and SSE parsing.
 */

import type { Message as OldMessage, TutorialData, StreamingChunk } from '@/app/chat/types';
import type { TutorialState } from '@/lib/tutorial/types';
import { getAgentPulseConfig } from '@/lib/env';

export interface AgentStreamRequest {
  message: string;
  conversationHistory: OldMessage[];
  tutorialData?: TutorialState | null;
  userId: string;
}

export interface AgentStreamChunk {
  type: 'text-delta' | 'status' | 'tutorial-data' | 'documentation-references' | 'error' | 'finish';
  textDelta?: string;
  message?: string;
  category?: string;
  tutorialData?: TutorialData;
  documents?: string[];
  error?: string;
  details?: string;
}

export interface AgentTitleRequest {
  message: string;
  conversationHistory: Array<{ author: string; content: string }>;
  use_direct_llm: boolean;
}

export class AgentService {
  private agentUrl: string;
  private bearerToken?: string;
  private defaultTimeout: number;

  constructor(timeout: number = 30000) {
    const config = getAgentPulseConfig();
    this.agentUrl = config.url;
    this.bearerToken = config.bearerToken;
    this.defaultTimeout = timeout;
  }

  /**
   * Stream agent response using Server-Sent Events
   */
  async streamResponse(request: AgentStreamRequest, timeout?: number): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    }

    const response = await fetch(this.agentUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(timeout ?? this.defaultTimeout),
    });

    if (!response.ok) {
      throw new Error(`Agent responded with status: ${response.status}`);
    }

    return response;
  }

  /**
   * Generate a title for a conversation using direct LLM
   * Returns the generated title or null if failed
   */
  async generateTitle(
    conversationHistory: Array<{ author: string; content: string }>,
    timeoutMs: number = 3000
  ): Promise<string | null> {
    try {
      const prompt = `Generate a very short session title summarizing the conversation topic.\n\nRequirements:\n- sentence case\n- no emojis\n- <= 60 characters\n- no quotes or markdown\n- output the title only, no extra text`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (this.bearerToken) {
        headers['Authorization'] = `Bearer ${this.bearerToken}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let agentResponse: Response | null = null;
      try {
        agentResponse = await fetch(this.agentUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: prompt,
            conversationHistory: conversationHistory,
            use_direct_llm: true,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!agentResponse || !agentResponse.ok) {
        console.error(
          `[AgentService] Title generation failed: ${agentResponse ? agentResponse.status : 'no-response'}`
        );
        return null;
      }

      const reader = agentResponse.body?.getReader();
      if (!reader) {
        console.error('[AgentService] No response body for title generation');
        return null;
      }

      let accumulated = '';
      const textDecoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          const text = textDecoder.decode(value);
          for (const line of text.split('\n')) {
            if (line.startsWith('data: ')) {
              try {
                const ev = JSON.parse(line.slice(6)) as AgentStreamChunk;
                if (ev.type === 'text-delta' && ev.textDelta) {
                  accumulated += ev.textDelta;
                }
                if (ev.type === 'finish') {
                  try {
                    await reader.cancel();
                  } catch {
                    // Ignore cancel errors
                  }
                  break;
                }
              } catch {
                // Ignore JSON parse errors
              }
            }
          }
        }
      }

      return this.sanitizeTitle(accumulated) || 'New chat';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('The operation was aborted') || msg.includes('aborted')) {
        console.error(`[AgentService] Title generation timeout after ${timeoutMs}ms`);
      } else {
        console.error(`[AgentService] Title generation failed: ${msg}`);
      }
      return null;
    }
  }

  /**
   * Parse SSE stream into chunks
   */
  parseSSEChunk(line: string): AgentStreamChunk | null {
    if (!line.startsWith('data: ')) {
      return null;
    }

    try {
      const data = JSON.parse(line.slice(6)) as StreamingChunk;
      return data as AgentStreamChunk;
    } catch (error) {
      console.error('[AgentService] Failed to parse SSE chunk:', error);
      return null;
    }
  }

  /**
   * Sanitize title generated by agent
   */
  private sanitizeTitle(input: string): string {
    if (!input) return '';

    let s = input.trim();

    // Strip wrapping quotes/backticks
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")) ||
      (s.startsWith('`') && s.endsWith('`'))
    ) {
      s = s.slice(1, -1).trim();
    }

    // Remove markdown emphasis
    s = s.replace(
      /\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_/g,
      (_m, a, b, c, d) => a || b || c || d || ''
    );

    // Remove emojis (basic unicode emoji ranges)
    s = s.replace(/[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    // Collapse whitespace
    s = s.replace(/\s+/g, ' ').trim();

    // Sentence case
    s = this.sentenceCase(s);

    // Trim trailing punctuation noise
    s = s.replace(/[\s\-–—:;,\.]+$/g, '').trim();

    // Enforce 60 chars
    if (s.length > 60) {
      s = s.slice(0, 60).trim();
    }

    return s;
  }

  /**
   * Convert string to sentence case
   */
  private sentenceCase(str: string): string {
    if (!str) return '';
    const lower = str.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
}
