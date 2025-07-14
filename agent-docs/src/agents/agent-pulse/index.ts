import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import type { 
  ChatMessage, 
  ChatSession, 
  ChatRequest, 
  TutorialRequest, 
  AgentRequestData 
} from './types';

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

function createNewSession(sessionId: string): ChatSession {
  const now = new Date().toISOString();
  return {
    sessionId,
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
      ctx.logger.info('Creating new session: %s', sessionId);
      session = createNewSession(sessionId);
    }

    // Process request with session context
    let result;
    if (requestData.type === 'chat') {
      ctx.logger.info('Processing chat request: %s', requestData.message);
      result = await handleChatRequest(requestData, session, ctx);
    } else if (requestData.type === 'tutorial') {
      ctx.logger.info('Processing tutorial request: %s', requestData.action);
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
      return await getTutorialList(ctx);
    case 'start':
      return await getTutorialStart(request.tutorialId, session, ctx);
    case 'next':
      return await getTutorialNext(session, ctx, request.step);
    case 'previous':
      return await getTutorialPrevious(session, ctx, request.step);
    case 'reset':
      return await getTutorialStart(request.tutorialId, session, ctx);
    default:
      return {
        type: 'tutorial',
        error: 'Invalid tutorial action'
      };
  }
}

// Fetch list of available tutorials
async function getTutorialList(ctx: AgentContext) {
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const tutorials = await response.json();
    
    return {
      type: 'tutorial',
      action: 'list',
      tutorials: tutorials,
      message: 'Here are the available tutorials. Which one would you like to start?'
    };
  } catch (error) {
    ctx.logger.error('Failed to fetch tutorials: %s', error);
    return {
      type: 'tutorial',
      action: 'list',
      error: 'Failed to fetch available tutorials',
      tutorials: []
    };
  }
}

// Start a tutorial or show available tutorials
async function getTutorialStart(tutorialId: string | undefined, session: ChatSession, ctx: AgentContext) {
  if (!tutorialId) {
    // No specific tutorial requested, show list
    return await getTutorialList(ctx);
  }

  try {
    // Fetch specific tutorial details
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${tutorialId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const tutorial = await response.json() as any; // Temporary type assertion
    
    // Update session with tutorial state
    session.currentTutorial = {
      tutorialId: tutorial.id,
      tutorialTitle: tutorial.title,
      currentStep: 1,
      totalSteps: tutorial.steps.length,
      startedAt: new Date().toISOString(),
      completed: false,
      progress: {}
    };

    // Fetch detailed first step content
    try {
      const stepResponse = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${tutorial.id}/steps/1`);
      if (!stepResponse.ok) {
        throw new Error(`HTTP error! status: ${stepResponse.status}`);
      }
      const stepData = await stepResponse.json() as any;
      
      return {
        type: 'tutorial',
        action: 'start',
        tutorialId: tutorial.id,
        tutorialTitle: tutorial.title,
        currentStep: 1,
        totalSteps: tutorial.steps.length,
        stepTitle: stepData.title,
        stepContent: stepData.description || stepData.content,
        instructions: stepData.instructions || 'Click next to continue to the next step.',
        initialCode: stepData.initialCode,
        expectedOutput: stepData.expectedOutput,
        nextAction: 'next'
      };
    } catch (stepError) {
      ctx.logger.error('Failed to fetch first step details for tutorial %s: %s', tutorial.id, stepError);
      
      // Fallback to basic tutorial info
      const firstStep = tutorial.steps[0];
      return {
        type: 'tutorial',
        action: 'start',
        tutorialId: tutorial.id,
        tutorialTitle: tutorial.title,
        currentStep: 1,
        totalSteps: tutorial.steps.length,
        stepTitle: firstStep.title,
        stepContent: firstStep.description,
        instructions: 'Click next to continue to the next step.',
        nextAction: 'next',
        error: 'Failed to load detailed step content'
      };
    }
  } catch (error) {
    ctx.logger.error('Failed to start tutorial %s: %s', tutorialId, error);
    return {
      type: 'tutorial',
      action: 'start',
      error: `Failed to start tutorial: ${tutorialId}`,
      fallback: 'Please try selecting a tutorial from the available list.'
    };
  }
}

async function getTutorialNext(session: ChatSession, ctx: AgentContext, targetStep?: number) {
  if (!session.currentTutorial) {
    return {
      type: 'tutorial',
      action: 'next',
      error: 'No active tutorial. Please start a tutorial first.'
    };
  }

  const currentTutorial = session.currentTutorial;
  const nextStep = targetStep || currentTutorial.currentStep + 1;
  
  if (nextStep > currentTutorial.totalSteps) {
    // Tutorial completed
    currentTutorial.completed = true;
    return {
      type: 'tutorial',
      action: 'next',
      currentStep: currentTutorial.totalSteps,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: 'Tutorial Complete!',
      content: `Congratulations! You've completed the ${currentTutorial.tutorialTitle} tutorial.`,
      instructions: 'You can start a new tutorial or ask me any questions.',
      nextAction: 'reset'
    };
  }

  // Mark previous step as completed
  if (currentTutorial.currentStep > 0) {
    currentTutorial.progress[currentTutorial.currentStep.toString()] = {
      completed: true,
      completedAt: new Date().toISOString()
    };
  }

  // Update current step
  currentTutorial.currentStep = nextStep;

  // Fetch step content from API
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${currentTutorial.tutorialId}/steps/${nextStep}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const stepData = await response.json() as any;

    return {
      type: 'tutorial',
      action: 'next',
      currentStep: nextStep,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: stepData.title || `Step ${nextStep}`,
      content: stepData.description || stepData.content,
      instructions: stepData.instructions || (nextStep < currentTutorial.totalSteps ? 'Click next to continue.' : 'This is the final step!'),
      initialCode: stepData.initialCode,
      expectedOutput: stepData.expectedOutput,
      nextAction: nextStep < currentTutorial.totalSteps ? 'next' : 'complete'
    };
  } catch (error) {
    ctx.logger.error('Failed to fetch step %d for tutorial %s: %s', nextStep, currentTutorial.tutorialId, error);
    
    // Fallback response if API fails
    return {
      type: 'tutorial',
      action: 'next',
      currentStep: nextStep,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: `Step ${nextStep}`,
      content: `This is step ${nextStep} of the ${currentTutorial.tutorialTitle} tutorial.`,
      instructions: nextStep < currentTutorial.totalSteps ? 'Click next to continue.' : 'This is the final step!',
      nextAction: nextStep < currentTutorial.totalSteps ? 'next' : 'complete',
      error: 'Failed to load step content'
    };
  }
}

async function getTutorialPrevious(session: ChatSession, ctx: AgentContext, targetStep?: number) {
  if (!session.currentTutorial) {
    return {
      type: 'tutorial',
      action: 'previous',
      error: 'No active tutorial. Please start a tutorial first.'
    };
  }

  const currentTutorial = session.currentTutorial;
  const prevStep = targetStep || Math.max(1, currentTutorial.currentStep - 1);
  
  // Update current step
  currentTutorial.currentStep = prevStep;

  // Fetch step content from API
  try {
    const response = await fetch(`${TUTORIAL_API_BASE_URL}/api/tutorials/${currentTutorial.tutorialId}/steps/${prevStep}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const stepData = await response.json() as any;

    return {
      type: 'tutorial',
      action: 'previous',
      currentStep: prevStep,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: stepData.title || `Step ${prevStep}`,
      content: stepData.description || stepData.content,
      instructions: stepData.instructions || 'Navigate forward or backward through the tutorial.',
      initialCode: stepData.initialCode,
      expectedOutput: stepData.expectedOutput,
      nextAction: 'next'
    };
  } catch (error) {
    ctx.logger.error('Failed to fetch step %d for tutorial %s: %s', prevStep, currentTutorial.tutorialId, error);
    
    // Fallback response if API fails
    return {
      type: 'tutorial',
      action: 'previous',
      currentStep: prevStep,
      totalSteps: currentTutorial.totalSteps,
      tutorialTitle: currentTutorial.tutorialTitle,
      title: `Step ${prevStep}`,
      content: `This is step ${prevStep} of the ${currentTutorial.tutorialTitle} tutorial.`,
      instructions: 'Navigate forward or backward through the tutorial.',
      nextAction: 'next',
      error: 'Failed to load step content'
    };
  }
}
