import type { TutorialData, StreamingChunk, Session as OldSession } from '@/app/chat/types';
import { sessionService } from '@/lib/services';
import type { Session as NewSession, Message as NewMessage } from '@/lib/storage/data-model';

/**
 * Convert new Session model to old Session model for API compatibility
 */
function toOldSession(newSession: NewSession): OldSession {
  return {
    sessionId: newSession.sessionId,
    isTutorial: newSession.isTutorial,
    title: newSession.title,
    messages: newSession.recentMessages.map((msg) => ({
      id: msg.id,
      author: msg.role as 'USER' | 'ASSISTANT',
      content: msg.content,
      timestamp: msg.timestamp,
      tutorialData: msg.tutorialData,
      documentationReferences: msg.documentationReferences,
    })),
  };
}

/**
 * Send SSE event helper
 */
function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * Configuration for creating an agent stream processor
 */
export interface AgentStreamProcessorConfig {
  userId: string;
  sessionId: string;
  assistantMessageId: string;
  /** Optional callback to send additional events before stream starts */
  onStart?: (controller: TransformStreamDefaultController) => Promise<void>;
}

/**
 * Creates a TransformStream that processes agent response chunks and saves to database
 * Handles tutorial data, documentation references, and title generation
 * Used by both /messages and /regenerate endpoints to reduce duplication
 */
export async function createAgentStreamProcessor(
  config: AgentStreamProcessorConfig
): Promise<TransformStream<Uint8Array, Uint8Array>> {
  const { userId, sessionId, assistantMessageId, onStart } = config;

  // Load TutorialStateManager
  const { TutorialStateManager } = await import('@/lib/tutorial/state-manager');

  // Track accumulated data
  let accumulatedContent = '';
  let finalTutorialData: TutorialData | undefined;
  let documentationReferences: string[] = [];

  return new TransformStream({
    start: async (controller) => {
      // Allow caller to send custom events at start (e.g., 'start' event for regenerate)
      if (onStart) {
        await onStart(controller);
      }
    },

    transform: async (chunk, controller) => {
      // Forward chunk to client immediately
      controller.enqueue(chunk);

      // Parse and accumulate for database storage
      const text = new TextDecoder().decode(chunk);
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        try {
          const data = JSON.parse(line.slice(6)) as StreamingChunk;

          if (data.type === 'text-delta' && data.textDelta) {
            accumulatedContent += data.textDelta;
          } else if (data.type === 'tutorial-data' && data.tutorialData) {
            finalTutorialData = data.tutorialData;

            // Update tutorial progress
            await TutorialStateManager.updateTutorialProgress(
              userId,
              finalTutorialData.tutorialId,
              finalTutorialData.currentStep,
              finalTutorialData.totalSteps
            );

            // Mark session as tutorial
            await sessionService.updateSession(userId, sessionId, { isTutorial: true });
          } else if (data.type === 'documentation-references' && data.documents) {
            documentationReferences = data.documents;
          } else if (data.type === 'finish') {
            // Save assistant message to database
            const assistantMessage: NewMessage = {
              id: assistantMessageId,
              sessionId,
              role: 'ASSISTANT',
              content: accumulatedContent,
              timestamp: new Date().toISOString(),
              status: 'COMPLETED',
              tutorialData: finalTutorialData,
              documentationReferences:
                documentationReferences.length > 0 ? documentationReferences : undefined,
            };

            await sessionService.addMessageToSession(userId, sessionId, assistantMessage);

            // Get updated session and send to client
            const updatedSession = await sessionService.getSession(userId, sessionId);
            if (updatedSession) {
              controller.enqueue(
                new TextEncoder().encode(
                  sseEvent({ type: 'finish', session: toOldSession(updatedSession) })
                )
              );
            } else {
              console.error('[AgentStreamProcessor] Could not fetch updated session for finish event');
            }

            // Trigger background title generation (don't await)
            void generateTitleInBackground(userId, sessionId);
          }
        } catch (error) {
          console.error('[AgentStreamProcessor] Error parsing SSE chunk:', error);
        }
      }
    },
  });
}

/**
 * Generate session title in background after message completion
 */
async function generateTitleInBackground(userId: string, sessionId: string): Promise<void> {
  try {
    const { agentService } = await import('@/lib/services');
    const currentSession = await sessionService.getSession(userId, sessionId);

    if (!currentSession || currentSession.title) {
      return;
    }

    const history = currentSession.recentMessages.slice(-10).map((m) => ({
      author: m.role,
      content: m.content.slice(0, 400),
    }));

    const title = await agentService.generateTitle(history, 3000);
    if (title) {
      await sessionService.updateSession(userId, sessionId, { title });
    }
  } catch (error) {
    console.error('[AgentStreamProcessor] Title generation failed:', error);
  }
}
