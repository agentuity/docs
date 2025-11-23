import type { AgentContext } from "@agentuity/sdk";
import type { AgentState } from "../state";
import type { StreamingChunk } from "./types";
import { handleTutorialState } from "../state/manager";

/**
 * AI SDK v6 fullStream chunk types
 * @see https://sdk.vercel.ai/docs/ai-sdk-core/generating-text#full-stream
 */
interface TextStartChunk {
	type: "text-start";
	id: string;
}

interface TextDeltaChunk {
	type: "text-delta";
	text: string;
}

interface TextEndChunk {
	type: "text-end";
	id: string;
}

interface ToolInputStartChunk {
	type: "tool-input-start";
	toolCallId: string;
	toolName: string;
}

interface ToolInputDeltaChunk {
	type: "tool-input-delta";
	toolCallId: string;
	toolName: string;
	argsTextDelta: string;
}

interface ToolInputEndChunk {
	type: "tool-input-end";
	toolCallId: string;
	toolName: string;
}

interface ToolCallChunk {
	type: "tool-call";
	toolCallId: string;
	toolName: string;
	input: unknown;
}

interface ToolResultChunk {
	type: "tool-result";
	toolCallId: string;
	toolName: string;
	output: unknown;
}

interface ReasoningDeltaChunk {
	type: "reasoning-delta";
	text: string;
}

type V6StreamChunk =
	| TextStartChunk
	| TextDeltaChunk
	| TextEndChunk
	| ToolInputStartChunk
	| ToolInputDeltaChunk
	| ToolInputEndChunk
	| ToolCallChunk
	| ToolResultChunk
	| ReasoningDeltaChunk;

// For unhandled chunk types
interface UnknownChunk {
	type: string;
	[key: string]: unknown;
}

/**
 * State tracked during stream processing
 */
interface StreamState {
	accumulatedContent: string;
	currentToolInput: string;
	currentToolName: string;
}

export function createStreamingProcessor(
	result: { fullStream: AsyncIterable<V6StreamChunk | UnknownChunk> },
	state: AgentState,
	ctx: AgentContext
): ReadableStream {
	return new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			// Stream state - scoped to this request
			const streamState: StreamState = {
				accumulatedContent: "",
				currentToolInput: "",
				currentToolName: "",
			};

			try {
				for await (const chunk of result.fullStream) {
					processChunk(chunk, controller, encoder, ctx, streamState);
				}

				// Process tutorial state after streaming
				const finalTutorialData = await handleTutorialState(state, ctx);
				if (finalTutorialData) {
					sendChunk(controller, encoder, {
						type: "tutorial-data",
						tutorialData: finalTutorialData,
					});
				}

				// Send documentation references if available
				const documentationReferences = state.getDocumentationReferences();
				if (documentationReferences.length > 0) {
					sendChunk(controller, encoder, {
						type: "documentation-references",
						documents: documentationReferences,
					});
					ctx.logger.info("Sent %d documentation references to client", documentationReferences.length);
				}

				sendChunk(controller, encoder, { type: "finish" });
				controller.close();
			} catch (error) {
				ctx.logger.error(
					"Error in streaming response: %s",
					error instanceof Error ? error.message : String(error)
				);
				sendChunk(controller, encoder, {
					type: "error",
					error: "Sorry, I encountered an error while processing your request.",
					details: error instanceof Error ? error.message : String(error),
				});
				controller.close();
			}
		},
	});
}

function processChunk(
	chunk: V6StreamChunk | UnknownChunk,
	controller: ReadableStreamDefaultController,
	encoder: TextEncoder,
	ctx: AgentContext,
	streamState: StreamState
): void {
	const chunkType = chunk.type;

	switch (chunkType) {
		case "text-start":
			sendChunk(controller, encoder, {
				type: "status",
				message: "typing-start",
				category: "streaming",
			});
			break;

		case "text-delta": {
			const textChunk = chunk as TextDeltaChunk;
			streamState.accumulatedContent += textChunk.text;
			sendChunk(controller, encoder, {
				type: "text-delta",
				textDelta: textChunk.text,
			});
			break;
		}

		case "text-end":
			sendChunk(controller, encoder, {
				type: "status",
				message: "typing-end",
				category: "streaming",
			});
			break;

		case "tool-input-start": {
			const toolStartChunk = chunk as ToolInputStartChunk;
			streamState.currentToolInput = "";
			streamState.currentToolName = toolStartChunk.toolName;
			sendChunk(controller, encoder, {
				type: "status",
				message: `Preparing ${getToolDisplayName(toolStartChunk.toolName)}...`,
				category: "tool",
			});
			break;
		}

		case "tool-input-delta": {
			const toolDeltaChunk = chunk as ToolInputDeltaChunk;
			streamState.currentToolInput += toolDeltaChunk.argsTextDelta;
			const progressMessage = parseToolInputProgress(
				streamState.currentToolName,
				streamState.currentToolInput
			);
			if (progressMessage) {
				sendChunk(controller, encoder, {
					type: "status",
					message: progressMessage,
					category: "tool",
				});
			}
			break;
		}

		case "tool-input-end":
			sendChunk(controller, encoder, {
				type: "status",
				message: getToolStatusMessage(streamState.currentToolName),
				category: "tool",
			});
			break;

		case "tool-call": {
			const toolCallChunk = chunk as ToolCallChunk;
			sendChunk(controller, encoder, {
				type: "status",
				message: getToolStatusMessage(toolCallChunk.toolName),
				category: "tool",
			});
			ctx.logger.debug("Tool called: %s", toolCallChunk.toolName);
			break;
		}

		case "tool-result":
			handleToolResult(chunk as ToolResultChunk, controller, encoder, ctx);
			break;

		case "reasoning-delta":
			sendChunk(controller, encoder, {
				type: "status",
				message: "Thinking hard...",
				category: "thinking",
			});
			break;

		default:
			// Log unhandled types for debugging (helps identify new v6 events)
			ctx.logger.debug("Unhandled chunk type: %s", chunkType);
			break;
	}
}

function handleToolResult(
	chunk: ToolResultChunk,
	controller: ReadableStreamDefaultController,
	encoder: TextEncoder,
	ctx: AgentContext
): void {
	if (chunk.toolName !== "askDocsAgentTool") return;

	const output = chunk.output as { answer?: string; documents?: string[] } | null;
	if (!output) return;

	if (output.answer) {
		sendChunk(controller, encoder, {
			type: "text-delta",
			textDelta: output.answer + "\n\n",
		});
		ctx.logger.info("Sent documentation answer to client");
	}

	if (output.documents?.length) {
		sendChunk(controller, encoder, {
			type: "documentation-references",
			documents: output.documents,
		});
		ctx.logger.info("Sent %d documentation references to client", output.documents.length);
	}
}

function sendChunk(
	controller: ReadableStreamDefaultController,
	encoder: TextEncoder,
	chunk: StreamingChunk
): void {
	controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
}

function getToolStatusMessage(toolName: string): string {
	const messages: Record<string, string> = {
		startTutorialById: "Starting tutorial...",
		askDocsAgentTool: "Searching documentation...",
		getUserTutorialProgress: "Fetching your progress...",
	};
	return messages[toolName] ?? "Processing your request...";
}

function getToolDisplayName(toolName: string): string {
	const names: Record<string, string> = {
		startTutorialById: "tutorial",
		askDocsAgentTool: "documentation search",
		getUserTutorialProgress: "progress check",
	};
	return names[toolName] ?? "request";
}

/**
 * Parse streaming tool input to extract meaningful progress info
 */
function parseToolInputProgress(toolName: string, partialInput: string): string | null {
	try {
		const parsed = JSON.parse(partialInput);

		if (toolName === "askDocsAgentTool" && parsed.query) {
			const query = parsed.query.substring(0, 50);
			const ellipsis = parsed.query.length > 50 ? "..." : "";
			return `Searching for: "${query}${ellipsis}"`;
		}

		if (toolName === "startTutorialById") {
			if (parsed.tutorialId && parsed.stepNumber) {
				return `Loading tutorial step ${parsed.stepNumber}...`;
			}
			if (parsed.tutorialId) {
				return "Loading tutorial...";
			}
		}

		return null;
	} catch {
		// JSON incomplete - try regex for partial matches
		if (toolName === "askDocsAgentTool") {
			const match = partialInput.match(/"query"\s*:\s*"([^"]*)/);
			if (match?.[1] && match[1].length > 3) {
				return `Searching for: "${match[1].substring(0, 40)}..."`;
			}
		}
		return null;
	}
}
