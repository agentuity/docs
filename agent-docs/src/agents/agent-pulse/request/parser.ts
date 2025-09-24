import type { AgentContext } from "@agentuity/sdk";
import type { ParsedAgentRequest } from "./types";

export function parseAgentRequest(
	jsonData: any,
	_ctx: AgentContext
): ParsedAgentRequest {
	let message = "";
	let conversationHistory: any[] = [];
	let tutorialData: any = undefined;
	let useDirectLLM = false;

	if (jsonData && typeof jsonData === "object" && !Array.isArray(jsonData)) {
		const body = jsonData as any;
		message = body.message || "";
		useDirectLLM = body.use_direct_llm || false;
		if (Array.isArray(body.conversationHistory)) {
			conversationHistory = body.conversationHistory.map((msg: any) => {
				return {
					role: msg.role || (msg.author ? msg.author.toUpperCase() : "USER"),
					content: msg.content || "",
				};
			});
		}

		tutorialData = body.tutorialData || undefined;
	} else {
		message = String(jsonData || "");
	}

	return {
		message,
		conversationHistory,
		tutorialData,
		useDirectLLM,
	};
}
