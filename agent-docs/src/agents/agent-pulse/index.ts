import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createTools } from "./tools";
import { createAgentState } from "./state";
import { getTutorialList, type Tutorial } from "./tutorial";
import { parseAgentRequest } from "./request/parser";
import { buildSystemPrompt } from "./context/builder";
import { createStreamingProcessor } from "./streaming/processor";
import type { ConversationMessage, TutorialState } from "./request/types";

/**
 * Builds a context string containing available tutorials for the system prompt
 */
async function buildContext(ctx: AgentContext, tutorialState?: TutorialState): Promise<string> {
  try {
    const tutorials = await getTutorialList(ctx);

    // Handle API failure early
    if (!tutorials.success || !tutorials.data) {
      ctx.logger.warn("Failed to load tutorial list");
      return defaultFallbackContext();
    }

    const tutorialContent = JSON.stringify(tutorials.data, null, 2);
    const currentTutorialInfo = buildCurrentTutorialInfo(tutorials.data, tutorialState);

    return `===AVAILABLE TUTORIALS====

    ${tutorialContent}

    ${currentTutorialInfo}

    Note: You should not expose the details of the tutorial IDs to the user.
`;
  } catch (error) {
    ctx.logger.error("Error building tutorial context: %s", error);
    return defaultFallbackContext();
  }
}

/**
 * Builds current tutorial information string if user is in a tutorial
 */
function buildCurrentTutorialInfo(tutorials: Tutorial[], tutorialState?: TutorialState): string {
  if (!tutorialState?.tutorialId) {
    return '';
  }

  const currentTutorial = tutorials.find(t => t.id === tutorialState.tutorialId);
  if (!currentTutorial) {
    return '\nWarning: User appears to be in an unknown tutorial.';
  }
  if (tutorialState.currentStep > currentTutorial.totalSteps) {
    return `\nUser has completed the tutorial: ${currentTutorial.title} (${currentTutorial.totalSteps} steps)`;
  }
  return `\nUser is currently on this tutorial: ${currentTutorial.title} (Step ${tutorialState.currentStep} of ${currentTutorial.totalSteps})`;
}

/**
 * Returns fallback context when tutorial list can't be loaded
 */
function defaultFallbackContext(): string {
  return `===AVAILABLE TUTORIALS====
Unable to load tutorial list. Please try again later or contact support.`;
}

export default async function Agent(req: AgentRequest, resp: AgentResponse, ctx: AgentContext) {
  try {
    ctx.logger.info("Pulse agent received request");

    // Parse request
    const parsedRequest = parseAgentRequest(await req.data.json(), ctx);

    // Create state manager
    const state = createAgentState();

    // Create tools with state context
    const tools = await createTools({
      state,
      agentContext: ctx
    });

    // Build messages for the conversation
    const messages: ConversationMessage[] = [
      ...parsedRequest.conversationHistory,
      { author: "USER", content: parsedRequest.message }
    ];

    // Build tutorial context and system prompt
    const tutorialContext = await buildContext(ctx, parsedRequest.tutorialData);
    const systemPrompt = await buildSystemPrompt(tutorialContext, ctx);

    // Generate streaming response
    const result = await streamText({
      model: openai("gpt-4o"),
      messages: messages.map(msg => ({
        role: msg.author === "USER" ? "user" : "assistant",
        content: msg.content,
      })),
      tools,
      maxSteps: 3,
      system: systemPrompt
    });

    // Create and return streaming response
    const stream = createStreamingProcessor(result, state, ctx);
    return resp.stream(stream, 'text/event-stream');

  } catch (error) {
    ctx.logger.error("Agent request failed: %s", error instanceof Error ? error.message : String(error));
    return resp.json({
      error: "Sorry, I encountered an error while processing your request. Please try again.",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
