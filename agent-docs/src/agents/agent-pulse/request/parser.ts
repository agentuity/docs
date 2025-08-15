import type { AgentContext } from "@agentuity/sdk";
import type { ParsedAgentRequest } from "./types";

export function parseAgentRequest(jsonData: any, ctx: AgentContext): ParsedAgentRequest {
  try {
    let message: string = "";
    let conversationHistory: any[] = [];
    let tutorialData: any = undefined;

    if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData)) {
      const body = jsonData as any;
      message = body.message || "";
      
      // Process conversation history
      if (Array.isArray(body.conversationHistory)) {
        conversationHistory = body.conversationHistory.map((msg: any) => {
          // Extract only role and content
          return {
            role: msg.role || (msg.author ? msg.author.toUpperCase() : "USER"),
            content: msg.content || ""
          };
        });
      }
      
      tutorialData = body.tutorialData || undefined;
    } else {
      // Fallback for non-object data
      message = String(jsonData || "");
    }

    return { message, conversationHistory, tutorialData };
  } catch (error) {
    ctx.logger.error("Failed to parse agent request: %s", error instanceof Error ? error.message : String(error));
    ctx.logger.debug("Raw request data: %s", JSON.stringify(jsonData));
    throw error; // Re-throw for centralized handling
  }
} 