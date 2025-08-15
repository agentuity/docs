import { NextRequest } from 'next/server';
import { getKVValue, setKVValue } from '@/lib/kv-store';
import { Session, Message, StreamingChunk, TutorialData } from '@/app/chat/types';
import { toISOString, getCurrentTimestamp } from '@/app/chat/utils/dateUtils';

// KV Store keys
const SESSION_PREFIX = 'session_';

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
  { params }: { params: { sessionId: string } }
) {
  console.log('[DEBUG] POST /api/sessions/[sessionId]/messages - Starting request');
  try {
    const paramsData = await params;
    const sessionId = paramsData.sessionId;
    const body = await request.json();
    console.log('[DEBUG] Request body:', JSON.stringify(body));
    const { message, processWithAgent = true } = body as {
      message: Message,
      processWithAgent?: boolean
    };

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ensure timestamp is in ISO string format
    if (message.timestamp) {
      message.timestamp = toISOString(message.timestamp);
    }
    const sessionResponse = await getKVValue<Session>(`${SESSION_PREFIX}${sessionId}`, { storeName: 'chat-sessions' });
    if (!sessionResponse.success || !sessionResponse.data) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const session = sessionResponse.data;
    console.log('[DEBUG] Session found:', JSON.stringify(session));

    const updatedSession: Session = {
      ...session,
      messages: [...session.messages, message]
    };
    console.log('[DEBUG] Updated session with user message:', JSON.stringify(updatedSession.messages.length));

    // Update the session with the user message
    console.log('[DEBUG] Updating session in KV store');
    const updateResult = await setKVValue(
      `${SESSION_PREFIX}${sessionId}`,
      updatedSession,
      { storeName: 'chat-sessions' }
    );
    console.log('[DEBUG] Session update result:', JSON.stringify(updateResult));

    if (!processWithAgent || message.author !== 'USER') {
      console.log('[DEBUG] Skipping agent processing, returning updated session');
      return new Response(
        JSON.stringify({ success: true, session: updatedSession }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[DEBUG] Processing user message with agent');

    // For user messages, process with agent and stream response

    // Create assistant message placeholder for tracking
    const assistantMessageId = crypto.randomUUID();
    console.log('[DEBUG] Created assistant message ID:', assistantMessageId);

    // Process with agent and stream response
    const agentUrl = 'http://127.0.0.1:3500/agent_ddcb59aa4473f1323be5d9f5fb62b74e';
    console.log('[DEBUG] Agent URL:', agentUrl);

    const agentPayload = {
      message: message.content,
      conversationHistory: updatedSession.messages.slice(-10),
      tutorialData: message.tutorialData
    };
    console.log('[DEBUG] Agent request payload:', JSON.stringify(agentPayload));

    console.log('[DEBUG] Sending request to agent');
    const agentResponse = await fetch(agentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentPayload),
    });

    console.log('[DEBUG] Agent response status:', agentResponse.status);
    if (!agentResponse.ok) {
      console.log('[DEBUG] Agent response not OK');
      throw new Error(`Agent responded with status: ${agentResponse.status}`);
    }

    // Process streaming response
    console.log('[DEBUG] Setting up streaming response processing');
    let accumulatedContent = '';
    let finalTutorialData: TutorialData | undefined = undefined;

    console.log('[DEBUG] Creating transform stream');
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        console.log('[DEBUG] Transform: received chunk');
        // Forward the chunk to the client
        controller.enqueue(chunk);

        // Process the chunk to accumulate the full response
        const text = new TextDecoder().decode(chunk);
        console.log('[DEBUG] Transform: decoded text:', text.length > 100 ? text.substring(0, 100) + '...' : text);
        const lines = text.split('\n');
        console.log('[DEBUG] Transform: split into', lines.length, 'lines');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              console.log('[DEBUG] Transform: processing data line');
              const data = JSON.parse(line.slice(6)) as StreamingChunk;
              console.log('[DEBUG] Transform: parsed data type:', data.type);

              if (data.type === 'text-delta' && data.textDelta) {
                accumulatedContent += data.textDelta;
              } else if (data.type === 'tutorial-data' && data.tutorialData) {
                finalTutorialData = data.tutorialData;
              } else if (data.type === 'finish') {
                console.log('[DEBUG] Transform: received finish event');
                // When the stream is finished, save the assistant message
                const assistantMessage: Message = {
                  id: assistantMessageId,
                  author: 'ASSISTANT',
                  content: accumulatedContent,
                  timestamp: getCurrentTimestamp(),
                  tutorialData: finalTutorialData
                };
                console.log('[DEBUG] Transform: created assistant message:', JSON.stringify({
                  id: assistantMessage.id,
                  contentLength: assistantMessage.content.length,
                  timestamp: assistantMessage.timestamp,
                  hasTutorialData: !!assistantMessage.tutorialData
                }));

                const finalSession = {
                  ...updatedSession,
                  messages: [...updatedSession.messages, assistantMessage]
                };

                console.log('[DEBUG] Transform: saving final session to KV store');
                const finalUpdateResult = await setKVValue(
                  `${SESSION_PREFIX}${sessionId}`,
                  finalSession,
                  { storeName: 'chat-sessions' }
                );
                console.log('[DEBUG] Transform: final session save result:', JSON.stringify(finalUpdateResult));
                
                // Send the final session in the finish event
                controller.enqueue(new TextEncoder().encode(
                  `data: ${JSON.stringify({ type: 'finish', session: finalSession })}\n\n`
                ));
              }
            } catch (error) {
              console.error('Error processing stream chunk:', error);
            }
          }
        }
      }
    });

    // Pipe the agent response through our transform stream
    console.log('[DEBUG] Getting reader from agent response');
    const reader = agentResponse.body?.getReader();
    if (!reader) {
      console.log('[DEBUG] No reader available from agent response');
      throw new Error('No response body from agent');
    }
    const writer = transformStream.writable.getWriter();
    // Start the piping process
    console.log('[DEBUG] Starting piping process');
    (async () => {
      try {
        console.log('[DEBUG] Entering read loop');
        let chunkCount = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[DEBUG] Reader done, exiting loop');
            break;
          }
          chunkCount++;
          await writer.write(value);
        }
        console.log('[DEBUG] Closing writer');
        await writer.close();
      } catch (error) {
        writer.abort(error);
      }
    })();


    return new Response(transformStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('[DEBUG] Error in messages API:', error);
    // Log the full error stack trace for debugging
    if (error instanceof Error) {
      console.error('[DEBUG] Error stack:', error.stack);
    }
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // This should never be reached, but adding for completeness
  console.log('[DEBUG] End of function reached unexpectedly');
}