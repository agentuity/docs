import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createTools } from "./tools";
import { createAgentState, ActionType, type AgentState } from "./state";
import { getTutorialList, getTutorialMeta, getTutorialStep } from "./tutorial";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Builds a context string containing available tutorials for the system prompt
 */
async function buildContext(ctx: AgentContext): Promise<string> {
  try {
    const tutorials = await getTutorialList(ctx);
    const tutorialContent = JSON.stringify(tutorials, null, 2);

    return `===AVAILABLE TUTORIALS====
${tutorialContent}

Note: You should not expose the details of the tutorial IDs to the user. However, you can use it to help the user
request to the right function when starting a tutorial because it requires the exact ID to match.
`;
  } catch (error) {
    ctx.logger.error("Error building tutorial context: %s", error);
    return `===AVAILABLE TUTORIALS====
Unable to load tutorial list.`;
  }
}

async function processState(state: AgentState, ctx: AgentContext): Promise<any> {
  const action = state.getAction();

  if (!action) {
    ctx.logger.info("No action to process");
    return null;
  }

  ctx.logger.info("Processing action: %s", JSON.stringify(action, null, 2));

  try {
    switch (action.type) {
      case ActionType.START_TUTORIAL_STEP:
        if (action.tutorialId) {
          const tutorialStep = await getTutorialStep(action.tutorialId, action.currentStep, ctx);
          if (tutorialStep.success && tutorialStep.data) {
            return {
              type: "tutorial",
              data: {
                tutorialId: action.tutorialId,
                currentStep: action.currentStep,
                tutorialStep: tutorialStep.data,
              }
            };
          }
        }
        break;
      default:
        ctx.logger.warn("Unknown action type: %s", action.type);
    }
  } catch (error) {
    ctx.logger.error("Error processing action: %s", error);
  }

  return null;
}

export default async function Agent(req: AgentRequest, resp: AgentResponse, ctx: AgentContext) {
  try {
    ctx.logger.info("Pulse agent received request");

    // Parse request body safely
    const jsonData = await req.data.json();
    let message: string = "";
    let conversationHistory: ConversationMessage[] = [];

    if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      const body = jsonData as any;
      message = body.message || "";
      conversationHistory = body.conversationHistory || [];
    } else {
      // Fallback for non-object data
      message = String(jsonData || "");
    }

    ctx.logger.info("Processing message: %s", message);
    ctx.logger.info("Conversation history length: %d", conversationHistory.length);

    // Create state manager for this request
    const state = createAgentState();

    // Create tools with state context
    const tools = createTools({
      state,
      agentContext: ctx
    });

    // Build messages for the conversation
    const messages: ConversationMessage[] = [
      ...conversationHistory,
      { role: "user", content: message }
    ];

    // Build tutorial context for the system prompt
    const tutorialContext = await buildContext(ctx);
    // Generate response using tools
    const initialResult = await generateText({
      model: openai("gpt-4o"),
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      tools,
      maxSteps: 3,
      system: `=== ROLE ===
You are Pulse, an AI assistant designed to help developers learn and navigate the Agentuity platform through interactive tutorials and clear guidance. Your primary goal is to assist users with understanding and using the Agentuity SDK effectively. When a user’s query is vague, unclear, or lacks specific intent, subtly suggest relevant interactive tutorial to guide them toward learning the platform. For clear, specific questions related to the Agentuity SDK or other topics, provide direct, accurate, and concise answers without mentioning tutorials unless relevant. Always maintain a friendly and approachable tone to encourage engagement.

Your role is to ensure user have a smooth tutorial experience!

When user is asking to move to the next tutorial, simply increment the step for them.

=== PERSONALITY ===
- Friendly and encouraging with light humour  
- Patient with learners at all levels  
- Clear and concise in explanations  
- Enthusiastic about teaching and problem-solving

=== Available Tools or Functions ===
You have access to various tools you can use -- use when appropriate!
1. Tutorial management  
   - startTutorialAtStep: Starting the user off at a specific step of a tutorial.
2. General assistance
   - askDocsAgentTool: retrieve Agentuity documentation snippets

=== TOOL-USAGE RULES (must follow) ===
- startTutorialById must only be used when user select a tutorial. If the user starts a new tutorial, the step number should be set to one. Valid step is between 1 and totalSteps of the specific tutorial.
- Treat askDocsAgentTool as a search helper; ignore results you judge irrelevant.

=== RESPONSE STYLE (format guidelines) ===
- Begin with a short answer, then elaborate if necessary.
- Add brief comments to complex code; skip obvious lines.
- End with a question when further clarification could help the user.

=== SAFETY & BOUNDARIES ===
- If asked for private data or secrets, refuse.  
- If the user requests actions outside your capabilities, apologise and explain.  
- Keep every response < 400 words

Generate a response to the user query accordingly and try to be helpful

=== CONTEXT ===
 

${tutorialContext}

=== END OF PROMPT ===`,
    });

    let finalResponseText = initialResult.text;
    let tutorialData = null;

    if (state.hasAction()) {
      tutorialData = await processState(state, ctx);
      state.clearAction();
    }

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: message },
      { role: "assistant", content: finalResponseText }
    ];

    return resp.json({
      response: finalResponseText,
      conversationHistory: updatedHistory,
      ...(tutorialData && { tutorialData })
    });

  } catch (error) {
    ctx.logger.error("Error in Pulse agent: %s", error);
    return resp.json({
      error: "Sorry, I encountered an error while processing your request. Please try again.",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
