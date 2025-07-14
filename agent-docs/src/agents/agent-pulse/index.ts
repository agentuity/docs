import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';

// Define the request types using discriminated union
interface ChatRequest {
  type: 'chat';
  message: string;
}

interface TutorialRequest {
  type: 'tutorial';
  action: 'start' | 'next' | 'previous' | 'reset';
  step?: number; // Optional for navigation to specific steps
}

type AgentRequestData = ChatRequest | TutorialRequest;

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function isChatRequest(data: unknown): data is ChatRequest {
  return isObject(data) &&
    data.type === 'chat' &&
    typeof data.message === 'string';
}

function isTutorialRequest(data: unknown): data is TutorialRequest {
  return isObject(data) &&
    data.type === 'tutorial' &&
    ['start', 'next', 'previous', 'reset'].includes(data.action as string);
}

function isValidRequest(data: unknown): data is AgentRequestData {
  return isChatRequest(data) || isTutorialRequest(data);
}

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const contentType = req.data.contentType;
  ctx.logger.info('Content type: %s', contentType);
  const dbName = "chat";
  try {
    if (contentType === 'application/json') {
      const requestData = await req.data.json();

      if (!isValidRequest(requestData)) {
        ctx.logger.warn('Invalid request format received');
        return resp.json({
          error: 'Invalid request format. Expected either chat or tutorial request.'
        }, 400);
      }

      // Handle chat requests
      if (requestData.type === 'chat') {
        ctx.logger.info('Processing chat request: %s', requestData.message);
        return resp.json(await handleChatRequest(requestData, ctx));
      }

      // Handle tutorial requests
      if (requestData.type === 'tutorial') {
        ctx.logger.info('Processing tutorial request: %s', requestData.action);
        return resp.json(await handleTutorialRequest(requestData, ctx));
      }
    } else {
      // Handle plain text as chat message
      const text = await req.data.text();
      ctx.logger.info('Processing plain text as chat: %s', text);
      return resp.json(await handleChatRequest({ type: 'chat', message: text }, ctx));
    }

    return resp.json({
      message: 'Request processed successfully',
    });
  } catch (e) {
    ctx.logger.error("Error processing request: %s", e instanceof Error ? e.message : String(e));
    return resp.json({
      error: 'Failed to process request'
    }, 500);
  }
}

// Handle chat requests
async function handleChatRequest(request: ChatRequest, ctx: AgentContext) {
  ctx.logger.info('Processing chat message: %s', request.message);

  // Here you would integrate with your preferred LLM/AI service
  // For now, returning a simple response
  return {
    type: 'chat',
    response: `You said: "${request.message}". This is a placeholder response for the chatbot functionality.`,
    timestamp: new Date().toISOString()
  };
}

// Handle tutorial requests
async function handleTutorialRequest(request: TutorialRequest, ctx: AgentContext) {
  ctx.logger.info('Processing tutorial action: %s', request.action);

  switch (request.action) {
    case 'start':
      return getTutorialStart();
    case 'next':
      return getTutorialNext(request.step);
    case 'previous':
      return getTutorialPrevious(request.step);
    case 'reset':
      return getTutorialStart();
    default:
      return {
        type: 'tutorial',
        error: 'Invalid tutorial action'
      };
  }
}

async function getTutorialStart() {
  const response = await fetch('http://localhost:8083/tutorials');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const tutorials = await response.json();
  return {
    type: 'tutorial',
    action: 'start',
    currentStep: 1,
    totalSteps: 5,
    title: 'Welcome to Agentuity Tutorial',
    content: 'This tutorial will guide you through the basics of Agentuity platform.',
    instructions: 'Click next to continue to the first step.',
    nextAction: 'next'
  };
}

function getTutorialNext(currentStep?: number) {
  const step = currentStep ? currentStep + 1 : 2;
  return {
    type: 'tutorial',
    action: 'next',
    currentStep: step,
    totalSteps: 5,
    title: `Tutorial Step ${step}`,
    content: `This is step ${step} of the tutorial. Content would be specific to this step.`,
    instructions: step < 5 ? 'Click next to continue.' : 'Tutorial complete!',
    nextAction: step < 5 ? 'next' : 'reset'
  };
}

function getTutorialPrevious(currentStep?: number) {
  const step = Math.max(1, currentStep ? currentStep - 1 : 1);
  return {
    type: 'tutorial',
    action: 'previous',
    currentStep: step,
    totalSteps: 5,
    title: `Tutorial Step ${step}`,
    content: `This is step ${step} of the tutorial. Content would be specific to this step.`,
    instructions: 'Navigate forward or backward through the tutorial.',
    nextAction: 'next'
  };
}
