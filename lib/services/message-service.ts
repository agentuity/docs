/**
 * Message Service
 *
 * Handles message creation, streaming, and archival.
 * Coordinates between SessionService and AgentService.
 */

import { randomUUID } from 'crypto';
import type { Message } from '../storage/data-model';
import type { SessionService } from './session-service';
import type { AgentService, AgentStreamRequest, AgentStreamChunk } from './agent-service';
import type { Message as OldMessage, TutorialData } from '@/app/chat/types';

export interface AddMessageInput {
  userId: string;
  sessionId: string;
  content: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
}

export interface ProcessMessageWithAgentInput {
  userId: string;
  sessionId: string;
  userMessage: OldMessage;
  conversationHistory: OldMessage[];
  tutorialData?: TutorialData;
}

export class MessageService {
  constructor(
    private sessionService: SessionService,
    private agentService: AgentService
  ) {}

  /**
   * Add a message to a session without agent processing
   */
  async addMessage(input: AddMessageInput): Promise<Message> {
    const message: Message = {
      id: randomUUID(),
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
    };

    // Add to session's recent messages
    await this.sessionService.addMessageToSession(
      input.userId,
      input.sessionId,
      message
    );

    return message;
  }

  /**
   * Process a user message with the agent and return streaming response
   *
   * This returns a TransformStream that:
   * 1. Forwards agent SSE chunks to the client
   * 2. Accumulates the response content
   * 3. Saves the assistant message when stream finishes
   * 4. Triggers background title generation
   */
  async processMessageWithAgent(
    input: ProcessMessageWithAgentInput
  ): Promise<{ transformStream: TransformStream; assistantMessageId: string }> {
    const assistantMessageId = randomUUID();

    // Stream request to agent
    const agentRequest: AgentStreamRequest = {
      message: input.userMessage.content,
      conversationHistory: input.conversationHistory,
      tutorialData: input.tutorialData,
      userId: input.userId,
    };

    const agentResponse = await this.agentService.streamResponse(agentRequest);

    if (!agentResponse.body) {
      throw new Error('No response body from agent');
    }

    // Accumulate response data
    let accumulatedContent = '';
    let finalTutorialData: TutorialData | undefined = undefined;
    let documentationReferences: string[] = [];

    const transformStream = new TransformStream({
      transform: async (chunk, controller) => {
        // Forward chunk to client
        controller.enqueue(chunk);

        // Parse and accumulate
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          const parsedChunk = this.agentService.parseSSEChunk(line);
          if (!parsedChunk) continue;

          if (parsedChunk.type === 'text-delta' && parsedChunk.textDelta) {
            accumulatedContent += parsedChunk.textDelta;
          } else if (parsedChunk.type === 'tutorial-data' && parsedChunk.tutorialData) {
            finalTutorialData = parsedChunk.tutorialData;

            // Update tutorial progress using the narrowed type
            const tutorialData = parsedChunk.tutorialData;
            const { TutorialStateManager } = await import('@/lib/tutorial/state-manager');
            await TutorialStateManager.updateTutorialProgress(
              input.userId,
              tutorialData.tutorialId,
              tutorialData.currentStep,
              tutorialData.totalSteps
            );
          } else if (parsedChunk.type === 'documentation-references' && parsedChunk.documents) {
            documentationReferences = parsedChunk.documents;
          } else if (parsedChunk.type === 'finish') {
            // Save assistant message
            const assistantMessage: Message = {
              id: assistantMessageId,
              sessionId: input.sessionId,
              role: 'ASSISTANT',
              content: accumulatedContent,
              timestamp: new Date().toISOString(),
              status: 'COMPLETED',
              tutorialData: finalTutorialData,
              documentationReferences:
                documentationReferences.length > 0 ? documentationReferences : undefined,
            };

            await this.sessionService.addMessageToSession(
              input.userId,
              input.sessionId,
              assistantMessage
            );

            // Trigger background title generation (don't await)
            void this.generateTitleIfNeeded(input.userId, input.sessionId);
          }
        }
      },
    });

    return { transformStream, assistantMessageId };
  }

  /**
   * Generate title for session if it doesn't have one
   */
  private async generateTitleIfNeeded(userId: string, sessionId: string): Promise<void> {
    try {
      const session = await this.sessionService.getSession(userId, sessionId);
      if (!session || session.title) {
        return; // Already has title
      }

      // Build compact conversation history
      const HISTORY_LIMIT = 10;
      const MAX_CONTENT_LEN = 400;

      const history = session.recentMessages.slice(-HISTORY_LIMIT).map((m) => ({
        author: m.role,
        content: m.content.slice(0, MAX_CONTENT_LEN),
      }));

      const title = await this.agentService.generateTitle(history, 3000);

      if (title) {
        // Update session title
        await this.sessionService.updateSession(userId, sessionId, { title });
      }
    } catch (error) {
      console.error('[MessageService] Title generation failed:', error);
      // Don't throw - this is a background operation
    }
  }

  /**
   * Archive old messages when session has >20 messages
   * This will be implemented later when needed
   */
  private async archiveOldMessages(userId: string, sessionId: string): Promise<void> {
    // TODO: Implement message archival
    // 1. Get session
    // 2. If messageCount > 20, archive messages beyond the 20 most recent
    // 3. Store archived messages in MESSAGES bucket with key: {sessionId}:{messageId}
  }
}
