import type { StreamTextResult, Tool } from 'ai';
import type { StreamingChunk, Action } from './types';
import { handleTutorialState } from './state-manager';

/**
 * Creates a ReadableStream that processes AI streaming responses
 * and formats them as SSE-compatible chunks
 */
export function createStreamingProcessor(
	result: StreamTextResult<>,
	state: { action: Action | null },
	logger: any
): ReadableStream {
	return new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			try {
				let stepCount = 0;
				// Stream AI response chunks
				for await (const chunk of result.fullStream) {
					// Track steps for debugging
					if (chunk.type === 'start-step') {
						stepCount++;
						logger.info('=== STARTING STEP %d ===', stepCount);
					}

					// Handle text deltas - the AI SDK provides text in the 'textDelta' field
					if (chunk.type === 'text-delta') {
						// NOTE: AI SDK types say 'textDelta' but runtime provides 'text'
						const textContent = chunk.textDelta || (chunk as any).text;

						if (textContent) {
							const sseChunk: StreamingChunk = {
								type: 'text-delta',
								textDelta: textContent,
							};
							sendChunk(controller, encoder, sseChunk);
						}
					} else if (chunk.type === 'tool-call') {
						const toolName = chunk.toolName || 'tool';
						const userFriendlyMessage = getToolStatusMessage(toolName);
						const sseChunk: StreamingChunk = {
							type: 'status',
							message: userFriendlyMessage,
							category: 'tool',
						};
						sendChunk(controller, encoder, sseChunk);
						logger.info('Tool called: %s', toolName);
					} else if (chunk.type === 'reasoning-delta') {
						logger.info('REASONING: %s', chunk.reasoningDelta);
					} else if (chunk.type === 'tool-result') {
						logger.info('Tool result received for: %s', chunk.toolName);
					} else if (chunk.type === 'finish-step') {
						logger.info('=== FINISHED STEP %d with reason: %s ===', stepCount, chunk.finishReason);
					} else if (chunk.type === 'finish') {
						logger.info('=== STREAM COMPLETE: finishReason=%s, totalSteps=%d ===', chunk.finishReason, stepCount);
					} else if (
						chunk.type === 'start' ||
						chunk.type === 'start-step' ||
						chunk.type === 'tool-input-start' ||
						chunk.type === 'tool-input-delta' ||
						chunk.type === 'tool-input-end'
					) {
						// These are internal AI SDK chunks - we don't need to send them to the client
						logger.info('Internal chunk type: %s', chunk.type);
					} else {
						logger.info('Unhandled chunk type: %s', chunk.type);
					}
				}

				logger.info('=== EXITED STREAM LOOP - Total steps processed: %d ===', stepCount);

				// Process tutorial state and fetch complete tutorial data if available
				const finalTutorialData = await handleTutorialState(state, logger);

				// Send tutorial data if available
				if (finalTutorialData) {
					const tutorialChunk: StreamingChunk = {
						type: 'tutorial-data',
						tutorialData: finalTutorialData,
					};
					sendChunk(controller, encoder, tutorialChunk);
					logger.info('Sent tutorial data chunk with step content');
				}

				// Send finish signal
				const finishChunk: StreamingChunk = {
					type: 'finish',
				};
				sendChunk(controller, encoder, finishChunk);

				controller.close();
			} catch (error) {
				logger.error(
					'Error in streaming response: %s',
					error instanceof Error ? error.message : String(error)
				);
				const errorChunk: StreamingChunk = {
					type: 'error',
					error: 'Sorry, I encountered an error while processing your request. Please try again.',
					details: error instanceof Error ? error.message : String(error),
				};
				sendChunk(controller, encoder, errorChunk);
				controller.close();
			}
		},
	});
}

/**
 * Encodes and sends a chunk in SSE format
 */
function sendChunk(
	controller: ReadableStreamDefaultController,
	encoder: TextEncoder,
	chunk: StreamingChunk
): void {
	controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
}

/**
 * Maps tool names to user-friendly status messages
 */
function getToolStatusMessage(toolName: string): string {
	switch (toolName) {
		case 'startTutorialAtStep':
			return 'Starting tutorial...';
		case 'askDocsAgentTool':
			return 'Searching documentation...';
		default:
			return 'Processing your request...';
	}
}
