import type { AgentContext } from "@agentuity/sdk";
import type { AgentState } from "../state";
import type { StreamingChunk } from "./types";
import { handleTutorialState } from "../state/manager";

export function createStreamingProcessor(
	result: any,
	state: AgentState,
	ctx: AgentContext
): ReadableStream {
	return new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			const accumulatedContent = "";

			try {
				// Stream only safe, user-facing content
				for await (const chunk of result.fullStream) {
					await processChunk(
						chunk,
						controller,
						encoder,
						ctx,
						accumulatedContent
					);
				}

				// Process tutorial state after streaming text
				const finalTutorialData = await handleTutorialState(state, ctx);

				// Send tutorial data if available
				if (finalTutorialData) {
					sendChunk(controller, encoder, {
						type: "tutorial-data",
						tutorialData: finalTutorialData,
					});
				}

				// Send finish signal
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

async function processChunk(
	chunk: any,
	controller: ReadableStreamDefaultController,
	encoder: TextEncoder,
	ctx: AgentContext,
	accumulatedContent: string
): Promise<void> {
	try {
		if (chunk.type === "text-delta") {
			accumulatedContent += chunk.textDelta;
			sendChunk(controller, encoder, {
				type: "text-delta",
				textDelta: chunk.textDelta,
			});
		} else if (chunk.type === "tool-call") {
			const toolName = chunk.toolName || "tool";
			const userFriendlyMessage = getToolStatusMessage(toolName);
			sendChunk(controller, encoder, {
				type: "status",
				message: userFriendlyMessage,
				category: "tool",
			});
			ctx.logger.debug("Tool called: %s", toolName);
		} else if (chunk.type === "reasoning") {
			ctx.logger.debug("REASONING: %s", chunk);
		} else {
			ctx.logger.debug("Skipping chunk type: %s", chunk.type);
			ctx.logger.debug(chunk);
		}
	} catch (error) {
		ctx.logger.error(
			"Failed to process chunk: %s",
			error instanceof Error ? error.message : String(error)
		);
		ctx.logger.debug("Chunk data: %s", JSON.stringify(chunk));
		throw error; // Re-throw for centralized handling
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
	switch (toolName) {
		case "startTutorialById":
			return "Starting tutorial...";
		case "queryOtherAgent":
			return "Searching documentation...";
		default:
			return "Processing your request...";
	}
}
