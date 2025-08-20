import { NextRequest, NextResponse } from 'next/server';
import { getKVValue, setKVValue } from '@/lib/kv-store';
import { Session, Message, StreamingChunk, TutorialData } from '@/app/chat/types';
import { toISOString, getCurrentTimestamp } from '@/app/chat/utils/dateUtils';

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
  try {
    const userId = request.cookies.get('chat_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const paramsData = await params;
    const sessionId = paramsData.sessionId;
    const body = await request.json();
    const { message, processWithAgent = true } = body as {
      message: Message,
      processWithAgent?: boolean
    };

    if (!message) {
      return NextResponse.json(
        { error: 'Message data is required' },
        { status: 400 }
      );
    }

    // Ensure timestamp is in ISO string format
    if (message.timestamp) {
      message.timestamp = toISOString(message.timestamp);
    }
    const sessionKey = `${userId}_${sessionId}`;
    const sessionResponse = await getKVValue<Session>(sessionKey, { storeName: 'chat-sessions' });
    if (!sessionResponse.success || !sessionResponse.data) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const session = sessionResponse.data;

    const updatedSession: Session = {
      ...session,
      messages: [...session.messages, message]
    };

    await setKVValue(
      sessionKey,
      updatedSession,
      { storeName: 'chat-sessions' }
    );

    if (!processWithAgent || message.author !== 'USER') {
      return NextResponse.json(
        { success: true, session: updatedSession },
        { status: 200 }
      );
    }

    // For user messages, process with agent and stream response

    // Create assistant message placeholder for tracking
    const assistantMessageId = crypto.randomUUID();

    // Process with agent and stream response
    const agentUrl = 'http://127.0.0.1:3500/agent_ddcb59aa4473f1323be5d9f5fb62b74e';

    const agentPayload = {
      message: message.content,
      conversationHistory: updatedSession.messages.slice(-10),
      tutorialData: message.tutorialData
    };

    const agentResponse = await fetch(agentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(agentPayload),
    });

    if (!agentResponse.ok) {
      throw new Error(`Agent responded with status: ${agentResponse.status}`);
    }

    // Process streaming response 
    let accumulatedContent = '';
    let finalTutorialData: TutorialData | undefined = undefined;

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        // Forward the chunk to the client
        controller.enqueue(chunk);

        // Process the chunk to accumulate the full response
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as StreamingChunk;

              if (data.type === 'text-delta' && data.textDelta) {
                accumulatedContent += data.textDelta;
              } else if (data.type === 'tutorial-data' && data.tutorialData) {
                finalTutorialData = data.tutorialData;
              } else if (data.type === 'finish') {
                // When the stream is finished, save the assistant message
                const assistantMessage: Message = {
                  id: assistantMessageId,
                  author: 'ASSISTANT',
                  content: accumulatedContent,
                  timestamp: getCurrentTimestamp(),
                  tutorialData: finalTutorialData
                };

                const finalSession = {
                  ...updatedSession,
                  messages: [...updatedSession.messages, assistantMessage]
                };

                await setKVValue(
                  sessionKey,
                  finalSession,
                  { storeName: 'chat-sessions' }
                );

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


    return new NextResponse(transformStream.readable, {
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
}