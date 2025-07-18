import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createTools } from "./tools";
import { createAgentState } from "./state";
import { fetchTutorialContent, type TutorialData } from "./tutorial-helpers";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// Tutorial list data structure
interface TutorialListData {
  type: "tutorial_list";
  tutorials: Array<{ id: string; title: string; description: string }>;
}

// Tutorial progress data structure  
interface TutorialProgressData {
  type: "tutorial_progress";
  tutorialId: string;
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
}

// Union type for all possible tutorial data responses
type TutorialResponseData = TutorialData | TutorialListData | TutorialProgressData;

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

    // Generate response using tools
    const initialResult = await generateText({
      model: openai("gpt-4o"),
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      tools,
      maxSteps: 2,
      system: `=== ROLE (what you are) ===
You are Pulse, an AI assistant who helps developers learn and navigate the Agentuity platform through interactive tutorials.

=== PERSONALITY (how you speak) ===
- Friendly and encouraging with light humour  
- Patient with learners at all levels  
- Clear and concise in explanations  
- Enthusiastic about teaching and problem-solving  

=== CAPABILITIES (what you can do) ===
1. Tutorial management  
   - startTutorial - begin a chosen tutorial
   - fetchTutorialList - list available tutorials
   - nextTutorialStep - advance to the next tutorial step
2. General assistance
   - askDocsAgentTool - retrieve Agentuity documentation snippets
   - Debug code and troubleshoot issues

=== TOOL-USAGE RULES (must follow) ===
- Call startTutorial only after the user has selected a tutorial.
- Use fetchTutorialLists to get available tutorials information
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

=== END OF PROMPT ===`,
    });

    let finalResponseText = initialResult.text;
    console.log(finalResponseText)
    // Handle tool calls if the AI requested them
    // if (initialResult.toolCalls && initialResult.toolCalls.length > 0) {
    //   ctx.logger.info("AI requested %d tool calls, tools executed automatically", initialResult.toolCalls.length);
      
    //   // For now, provide a simple response when tools are called
    //   // The tool functions will update the state automatically
    //   finalResponseText = "I've processed that request for you. Let me know if you need anything else!";
    // }

    const actions = state.getActions();
    let tutorialData: TutorialResponseData | null = null;

    if (actions.length > 0) {
      ctx.logger.info("Processing %d actions from state queue", actions.length);

      for (const action of actions) {
        ctx.logger.info("Processing action: %s", JSON.stringify(action, null, 2));

        if (action.type == "start_tutorial" && action.tutorialId) {
          ctx.logger.info("Executing start_tutorial action for: %s", action.tutorialId);
          const basicTutorialData = await fetchTutorialContent(action.tutorialId, ctx);
          if (basicTutorialData) {
            tutorialData = basicTutorialData;
          }
        } else {
          ctx.logger.warn("Invalid action request")
        }
      }

      // Clear actions after processing
      state.clearActions();
    }

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: "user", content: message },
      { role: "assistant", content: finalResponseText }
    ];

    ctx.logger.info("Sending response with tutorial data: %s", tutorialData ? JSON.stringify(tutorialData, null, 2) : "none");

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