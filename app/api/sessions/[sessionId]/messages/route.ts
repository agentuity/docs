import { NextRequest, NextResponse } from "next/server";
import { getKVValue, setKVValue } from "@/lib/kv-store";
import {
  Session,
  Message,
  StreamingChunk,
  TutorialData,
} from "@/app/chat/types";
import { toISOString, getCurrentTimestamp } from "@/app/chat/utils/dateUtils";
import { getAgentPulseConfig } from "@/lib/env";
import { config } from "@/lib/config";
import { parseAndValidateJSON, SessionMessageRequestSchema } from "@/lib/validation/middleware";

// Constants
const DEFAULT_CONVERSATION_HISTORY_LIMIT = 10;
const AGENT_REQUEST_TIMEOUT = 30000; // 30 seconds


function sanitizeTitle(input: string): string {
  if (!input) return '';
  let s = input.trim();
  // Strip wrapping quotes/backticks
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith('\'') && s.endsWith('\'')) || (s.startsWith('`') && s.endsWith('`'))) {
    s = s.slice(1, -1).trim();
  }
  // Remove markdown emphasis
  s = s.replace(/\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_/g, (_m, a, b, c, d) => a || b || c || d || '');
  // Remove emojis (basic unicode emoji ranges)
  s = s.replace(/[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();
  // Sentence case
  s = sentenceCase(s);
  // Trim trailing punctuation noise
  s = s.replace(/[\s\-–—:;,\.]+$/g, '').trim();
  // Enforce 60 chars
  if (s.length > 60) s = s.slice(0, 60).trim();
  return s;
}

function sentenceCase(str: string): string {
  if (!str) return '';
  const lower = str.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

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
      storeName: config.defaultStoreName,
    });

    // Helper: background title generation and persistence
    async function generateAndPersistTitle(sessionId: string, sessionKey: string, finalSession: Session) {
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

        const prompt = `Generate a very short session title summarizing the conversation topic.\n\nRequirements:\n- sentence case\n- no emojis\n- <= 60 characters\n- no quotes or markdown\n- output the title only, no extra text`;

        const agentConfig = getAgentPulseConfig();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (agentConfig.bearerToken) headers['Authorization'] = `Bearer ${agentConfig.bearerToken}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        let agentResponse: Response | null = null;
        try {
          agentResponse = await fetch(agentConfig.url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              message: prompt,
              conversationHistory: history,
              use_direct_llm: true,
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!agentResponse || !agentResponse.ok) {
          console.error(`[title-gen] failed: bad response ${agentResponse ? agentResponse.status : 'no-response'}`);
          return;
        }

        const reader = agentResponse.body?.getReader();
        if (!reader) {
          console.error('[title-gen] failed: no response body');
          return;
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
                  const ev = JSON.parse(line.slice(6));
                  if (ev.type === 'text-delta' && ev.textDelta) accumulated += ev.textDelta;
                  if (ev.type === 'finish') {
                    try { await reader.cancel(); } catch { }
                    break;
                  }
                } catch { }
              }
            }
          }
        }

        const candidate = sanitizeTitle(accumulated);
        const title = candidate || 'New chat';

        // Re-fetch and set title only if still empty
        const latest = await getKVValue<Session>(sessionKey, { storeName: config.defaultStoreName });
        if (!latest.success || !latest.data) return;
        const current = latest.data as any;
        if (current.title) return;
        current.title = title;
        await setKVValue(sessionKey, current, { storeName: config.defaultStoreName });

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('The operation was aborted') || msg.includes('aborted')) {
          console.error('[title-gen] timeout after 3000ms');
        } else {
          console.error(`[title-gen] failed: ${msg}`);
        }
      }
    }
    if (!sessionResponse.success || !sessionResponse.data) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const session = sessionResponse.data;

    const updatedSession: Session = {
      ...session,
      messages: [...session.messages, message],
    };

    try {
      await setKVValue(sessionKey, updatedSession, {
        storeName: config.defaultStoreName,
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

    // Process with agent and stream response
    const agentConfig = getAgentPulseConfig();
    const agentUrl = agentConfig.url;

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

    // Prepare headers with optional bearer token
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (agentConfig.bearerToken) {
      headers["Authorization"] = `Bearer ${agentConfig.bearerToken}`;
    }

    // Real agent call (SSE response expected)
    const agentResponse = await fetch(agentUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(agentPayload),
      signal: AbortSignal.timeout(AGENT_REQUEST_TIMEOUT),
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent responded with status: ${agentResponse.status}`);
    }

    // Process streaming response
    let accumulatedContent = "";
    let finalTutorialData: TutorialData | undefined = undefined;

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // Forward the chunk to the client
        controller.enqueue(chunk);

        // Process the chunk to accumulate the full response
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamingChunk;

              if (data.type === "text-delta" && data.textDelta) {
                accumulatedContent += data.textDelta;
              } else if (data.type === "tutorial-data" && data.tutorialData) {
                finalTutorialData = data.tutorialData;

                // Update user's tutorial progress
                await TutorialStateManager.updateTutorialProgress(
                  userId,
                  finalTutorialData.tutorialId,
                  finalTutorialData.currentStep,
                  finalTutorialData.totalSteps
                );
              } else if (data.type === "finish") {
                // When the stream is finished, save the assistant message
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
                  storeName: config.defaultStoreName,
                });

                // Trigger background title generation if missing
                // Do not await to avoid delaying the client stream completion
                void generateAndPersistTitle(sessionId, sessionKey, finalSession);

                // Send the final session in the finish event
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({
                      type: "finish",
                      session: finalSession,
                    })}\n\n`
                  )
                );
              }
            } catch (error) {
              console.error("Error processing stream chunk:", error);
            }
          }
        }
      },
    });

    // Pipe the agent response through our transform stream
    const reader = agentResponse.body?.getReader();
    if (!reader) {
      throw new Error("No response body from agent");
    }
    const writer = transformStream.writable.getWriter();
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          try {
            await writer.write(value);
          } catch (writeError) {
            console.error('Error writing to transform stream:', writeError);
            throw writeError;
          }
        }
        await writer.close();
      } catch (error) {
        console.error('Error in stream processing:', error);
        writer.abort(error);
      }
    })();

    return new NextResponse(transformStream.readable, {
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
