import { NextRequest, NextResponse } from "next/server";
import { getKVValue, setKVValue } from "@/lib/kv-store";
import {
  Session,
  Message,
  StreamingChunk,
  TutorialData,
} from "@/app/chat/types";
import { toISOString, getCurrentTimestamp } from "@/app/chat/utils/dateUtils";
import { config } from "@/lib/config";
import { parseAndValidateJSON, SessionMessageRequestSchema } from "@/lib/validation/middleware";
import { titleGeneratorService, callAgentPulseStreaming } from "@/lib/api/services";

// Constants
const DEFAULT_CONVERSATION_HISTORY_LIMIT = 10;
const AGENT_REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * POST /api/sessions/[sessionId]/messages - Add a message to a session and process with streaming
 *
 * This endpoint now handles:
 * 1. Adding a user message to a session
 * 2. Processing the message with the agent
 * 3. Streaming the response back to the client
 * 4. Saving the assistant's response when complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const userId = request.cookies.get("chat_user_id")?.value;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 });
    }

    const paramsData = await params;
    const sessionId = paramsData.sessionId;

    const validation = await parseAndValidateJSON(request, SessionMessageRequestSchema);

    if (!validation.success) {
      return validation.response;
    }

    const { message, processWithAgent } = validation.data;

    // Ensure timestamp is in ISO string format
    if (message.timestamp) {
      message.timestamp = toISOString(message.timestamp);
    }
    const sessionKey = `${userId}_${sessionId}`;
    const sessionResponse = await getKVValue<Session>(sessionKey, {
      storeName: config.kvStoreName,
    });

    // Helper: background title generation and persistence
    async function generateAndPersistTitle(sessionKey: string, finalSession: Session) {
      try {
        if ((finalSession as any).title) {
          return; // Title already set
        }

        // Build compact conversation history (last 10 messages, truncate content)
        const HISTORY_LIMIT = 10;
        const MAX_CONTENT_LEN = 400;
        const history = finalSession.messages
          .slice(-HISTORY_LIMIT)
          .map(m => ({
            author: m.author,
            content: (m.content || '').slice(0, MAX_CONTENT_LEN),
          }));

        // Use the title generator service
        const title = await titleGeneratorService.generate(history);

        // Re-fetch and set title only if still empty
        const latest = await getKVValue<Session>(sessionKey, { storeName: config.kvStoreName });
        if (!latest.exists || !latest.data) return;
        const current = latest.data as any;
        if (current.title) return;
        current.title = title;
        await setKVValue(sessionKey, current, { storeName: config.kvStoreName });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[title-gen] failed: ${msg}`);
      }
    }
    if (!sessionResponse.exists || !sessionResponse.data) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionResponse.data;

    const updatedSession: Session = {
      ...session,
      messages: [...session.messages, message],
    };

    try {
      await setKVValue(sessionKey, updatedSession, {
        storeName: config.kvStoreName,
      });
    } catch (error) {
      console.error(
        `Failed to save session after adding message. SessionId: ${sessionId}, Error details:`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error && error.stack ? `Stack: ${error.stack}` : ''
      );
      return NextResponse.json(
        {
          error: "Failed to save message to session",
          details: "Unable to persist the message. Please try again."
        },
        { status: 500 }
      );
    }

    if (!processWithAgent || message.author !== "USER") {
      return NextResponse.json(
        { success: true, session: updatedSession },
        { status: 200 }
      );
    }

    // Create assistant message placeholder for tracking
    const assistantMessageId = crypto.randomUUID();

    // Get current tutorial state for the user
    const { TutorialStateManager } = await import('@/lib/tutorial/state-manager');
    const currentTutorialState = await TutorialStateManager.getCurrentTutorialState(userId);

    const agentPayload = {
      message: message.content,
      conversationHistory: updatedSession.messages.slice(
        -DEFAULT_CONVERSATION_HISTORY_LIMIT
      ),
      tutorialData: currentTutorialState,
    };

    // Create a readable stream to send SSE events to the client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let accumulatedContent = "";
        let finalTutorialData: TutorialData | undefined = undefined;

        try {
          // Call agent-pulse via service with streaming callbacks
          await callAgentPulseStreaming(agentPayload, {
            onTextDelta: (text) => {
              accumulatedContent += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text-delta', textDelta: text })}\n\n`)
              );
            },

            onStatus: (message, category) => {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'status', message, category })}\n\n`
                )
              );
            },

            onTutorialData: async (data) => {
              finalTutorialData = data;

              // Update user's tutorial progress
              await TutorialStateManager.updateTutorialProgress(
                userId,
                data.tutorialId,
                data.currentStep,
                data.totalSteps
              );

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'tutorial-data', tutorialData: data })}\n\n`
                )
              );
            },

            onFinish: async () => {
              // Save the assistant message
              const assistantMessage: Message = {
                id: assistantMessageId,
                author: "ASSISTANT",
                content: accumulatedContent,
                timestamp: getCurrentTimestamp(),
                tutorialData: finalTutorialData,
              };

              const finalSession = {
                ...updatedSession,
                messages: [...updatedSession.messages, assistantMessage],
              };

              await setKVValue(sessionKey, finalSession, {
                storeName: config.kvStoreName,
              });

              // Trigger background title generation if missing
              // Do not await to avoid delaying the client stream completion
              void generateAndPersistTitle(sessionKey, finalSession);

              // Send the final session in the finish event
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "finish",
                    session: finalSession,
                  })}\n\n`
                )
              );

              controller.close();
            },

            onError: (error) => {
              console.error('Agent error:', error);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'error', error })}\n\n`
                )
              );
              controller.close();
            },
          });
        } catch (error) {
          console.error('Error in agent stream:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in messages API:", error);
    // Log the full error stack trace for debugging
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
