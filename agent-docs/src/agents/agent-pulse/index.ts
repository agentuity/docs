import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import type { 
  ChatMessage, 
  ChatSession, 
  ChatRequest, 
  TutorialRequest, 
  AgentRequestData 
} from './types';
import { classifyTutorialIntent } from './tutorial-intent';
import { 
  getTutorialList as fetchTutorialList, 
  startTutorial, 
  nextTutorialStep, 
  previousTutorialStep 
} from './tutorial';

// API endpoints
const TUTORIAL_API_BASE_URL = 'http://localhost:3201';

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function isChatRequest(data: unknown): data is ChatRequest {
  return isObject(data) &&
    data.type === 'chat' &&
    typeof data.message === 'string' &&
    (data.sessionId === undefined || typeof data.sessionId === 'string');
}

function isTutorialRequest(data: unknown): data is TutorialRequest {
  return isObject(data) &&
    data.type === 'tutorial' &&
    ['start', 'next', 'previous', 'reset', 'list'].includes(data.action as string) &&
    (data.sessionId === undefined || typeof data.sessionId === 'string') &&
    (data.step === undefined || typeof data.step === 'number') &&
    (data.tutorialId === undefined || typeof data.tutorialId === 'string');
}

function isValidRequest(data: unknown): data is AgentRequestData {
  return isChatRequest(data) || isTutorialRequest(data);
}

// Session management utilities
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function loadSession(sessionId: string, ctx: AgentContext): Promise<ChatSession | null> {
  try {
    const result = await ctx.kv.get('chat-sessions', sessionId);
    if (!result.exists) {
      return null;
    }
    const sessionData = await result.data.text();
    return JSON.parse(sessionData) as ChatSession;
  } catch (error) {
    ctx.logger.error("Failed to load session %s: %s", sessionId, error);
    return null;
  }
}

async function saveSession(session: ChatSession, ctx: AgentContext): Promise<void> {
  try {
    // Update timestamps
    session.updatedAt = new Date().toISOString();
    session.lastActivity = new Date().toISOString();
    
    // Keep only last 50 messages for performance
    if (session.messages.length > 50) {
      session.messages = session.messages.slice(-50);
    }
    
    await ctx.kv.set('chat-sessions', session.sessionId, JSON.stringify(session));
    ctx.logger.info("Session %s saved successfully", session.sessionId);
  } catch (error) {
    ctx.logger.error("Failed to save session %s: %s", session.sessionId, error);
    throw error;
  }
}

function createNewSession(sessionId: string, sessionType: 'chat' | 'tutorial' = 'chat'): ChatSession {
  const now = new Date().toISOString();
  return {
    sessionId,
    sessionType,
    createdAt: now,
    updatedAt: now,
    lastActivity: now,
    isActive: true,
    messages: [],
    userProfile: {}
  };
}

function addMessageToSession(session: ChatSession, type: 'user' | 'assistant', content: string): ChatMessage {
  const message: ChatMessage = {
    id: generateMessageId(),
    type,
    content,
    timestamp: new Date().toISOString()
  };
  
  session.messages.push(message);
  return message;
}

// Handle chat messages in tutorial sessions using intent classification
async function handleTutorialChatMessage(message: string, session: ChatSession, ctx: AgentContext) {
  ctx.logger.info('Processing tutorial chat message: %s', message);

  // Add user message to session
  addMessageToSession(session, 'user', message);

  try {
    // Always get available tutorials for intent classification
    let availableTutorials: any[] = [];
    const tutorialListResponse = await fetchTutorialList(ctx);
    availableTutorials = Array.isArray(tutorialListResponse.tutorials) ? tutorialListResponse.tutorials : [];
  
    const intent = await classifyTutorialIntent(message, session, availableTutorials, ctx);

    let result;
    switch (intent.type) {
      case 'select_tutorial':
        if (intent.tutorialId) {
          ctx.logger.info('Attempting to start tutorial with ID: %s', intent.tutorialId);
          try {
            result = await startTutorial(intent.tutorialId, session, ctx);
          } catch (error) {
            ctx.logger.error('Failed to start tutorial %s: %s', intent.tutorialId, error);
            // Show available tutorials on error
            const tutorialListResponse = await fetchTutorialList(ctx);
            
            const errorMessage = `❌ Sorry, couldn't find tutorial "${intent.tutorialId}".\n\n${tutorialListResponse.message}`;
            
            result = {
              type: 'tutorial',
              action: 'error',
              message: errorMessage,
              tutorials: tutorialListResponse.tutorials,
              error: `Tutorial "${intent.tutorialId}" not found`
            };
          }
        } else {
          // Show tutorial list if no specific tutorial identified
          result = await fetchTutorialList(ctx);
        }
        break;

      case 'navigate':
        if (intent.direction === 'next') {
          result = await nextTutorialStep(session, ctx, intent.step);
        } else if (intent.direction === 'previous') {
          result = await previousTutorialStep(session, ctx, intent.step);
        } else if (intent.direction === 'specific' && intent.step) {
          result = await nextTutorialStep(session, ctx, intent.step);
        } else {
          result = {
            type: 'tutorial',
            error: 'Could not understand navigation request'
          };
        }
        break;

      case 'exit_tutorial':
        // Convert session back to chat mode
        session.sessionType = 'chat';
        session.currentTutorial = undefined;
        result = {
          type: 'chat',
          response: 'You have exited tutorial mode. How can I help you today?',
          timestamp: new Date().toISOString()
        };
        break;

      case 'help':
        result = {
          type: 'tutorial',
          action: 'help',
          message: 'Tutorial Help:\n- Say "next" or "previous" to navigate\n- Ask questions about the tutorial content\n- Say "exit" to leave tutorial mode\n- Ask for "list" to see available tutorials'
        };
        break;

      case 'question':
      default:
        // Handle as a tutorial-related question
        const questionResponse = `You asked: "${intent.content || message}". This is a placeholder for tutorial Q&A functionality.`;
        result = {
          type: 'tutorial',
          action: 'question',
          response: questionResponse,
          timestamp: new Date().toISOString()
        };
        break;
    }

    // Add assistant response to session
    let responseText = 'Tutorial action completed';
    
    // Extract response text from different result types
    if ('response' in result && result.response) {
      responseText = result.response as string;
    } else if ('message' in result && result.message) {
      responseText = result.message as string;
    } else if ('stepContent' in result && result.stepContent) {
      responseText = result.stepContent as string;
    } else if ('content' in result && result.content) {
      responseText = result.content as string;
    }
    
    addMessageToSession(session, 'assistant', responseText);

    return result;
  } catch (error) {
    ctx.logger.error('Error handling tutorial chat message: %s', error);
    
    const errorResponse = 'Sorry, I encountered an error processing your tutorial request. Please try again.';
    addMessageToSession(session, 'assistant', errorResponse);
    
    return {
      type: 'tutorial',
      error: errorResponse
    };
  }
}

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const contentType = req.data.contentType;
  ctx.logger.info('Content type: %s', contentType);
  
  try {
    let requestData: AgentRequestData;
    
    if (contentType === 'application/json') {
      const jsonData = await req.data.json();

      if (!isValidRequest(jsonData)) {
        ctx.logger.warn('Invalid request format received');
        return resp.json({
          error: 'Invalid request format. Expected either chat or tutorial request.'
        }, 400);
      }
      
      requestData = jsonData;
    } else {
      // Handle plain text as chat message
      const text = await req.data.text();
      ctx.logger.info('Processing plain text as chat: %s', text);
      requestData = { type: 'chat', message: text };
    }

    // Get or generate session ID
    const sessionId = requestData.sessionId || generateSessionId();
    ctx.logger.info('Processing request for session: %s', sessionId);

    // Load existing session or create new one
    let session = await loadSession(sessionId, ctx);
    if (!session) {
      // Determine session type based on request
      const sessionType = requestData.type === 'tutorial' ? 'tutorial' : 'chat';
      ctx.logger.info('Creating new session: %s with type: %s', sessionId, sessionType);
      session = createNewSession(sessionId, sessionType);
    }

    // Process request with session context
    let result;
    if (requestData.type === 'chat') {
      ctx.logger.info('Processing chat request: %s', requestData.message);
      
      // Route based on session type
      if (session.sessionType === 'tutorial') {
        // Handle chat message in tutorial context
        result = await handleTutorialChatMessage(requestData.message, session, ctx);
      } else {
        // Regular chat session
        result = await handleChatRequest(requestData, session, ctx);
      }
    } else if (requestData.type === 'tutorial') {
      ctx.logger.info('Processing tutorial request: %s', requestData.action);
      
      // Set session to tutorial mode
      session.sessionType = 'tutorial';
      result = await handleTutorialRequest(requestData, session, ctx);
    } else {
      return resp.json({
        error: 'Invalid request type'
      }, 400);
    }

    // Save session after processing
    await saveSession(session, ctx);

    return resp.json({
      ...result,
      sessionId: session.sessionId
    });
  } catch (e) {
    ctx.logger.error("Error processing request: %s", e instanceof Error ? e.message : String(e));
    return resp.json({
      error: 'Failed to process request'
    }, 500);
  }
}

// Handle chat requests
async function handleChatRequest(request: ChatRequest, session: ChatSession, ctx: AgentContext) {
  ctx.logger.info('Processing chat message: %s', request.message);

  // Add user message to session
  addMessageToSession(session, 'user', request.message);

  // Here you would integrate with your preferred LLM/AI service
  // For now, returning a simple response
  const response = `You said: "${request.message}". This is a placeholder response for the chatbot functionality.`;
  
  // Add assistant response to session
  addMessageToSession(session, 'assistant', response);

  return {
    type: 'chat',
    response,
    timestamp: new Date().toISOString(),
    messageCount: session.messages.length
  };
}

// Handle tutorial requests  
async function handleTutorialRequest(request: TutorialRequest, session: ChatSession, ctx: AgentContext) {
  ctx.logger.info('Processing tutorial action: %s', request.action);

  switch (request.action) {
    case 'list':
      return await fetchTutorialList(ctx);
    case 'start':
      if (request.tutorialId) {
        return await startTutorial(request.tutorialId, session, ctx);
      } else {
        return await fetchTutorialList(ctx);
      }
    case 'next':
      return await nextTutorialStep(session, ctx, request.step);
    case 'previous':
      return await previousTutorialStep(session, ctx, request.step);
    case 'reset':
      if (request.tutorialId) {
        return await startTutorial(request.tutorialId, session, ctx);
      } else {
        return await fetchTutorialList(ctx);
      }
    default:
      return {
        type: 'tutorial',
        error: 'Invalid tutorial action'
      };
  }
}
