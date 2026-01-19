import type { StreamTextResult, Tool } from 'ai';
import type { StreamingChunk, Action } from './types';
import { handleTutorialState } from './state-manager';

/**
 * Creates a ReadableStream that processes AI streaming responses
 * and formats them as SSE-compatible chunks using TransformStream
 */
export function createStreamingProcessor<TOOLS extends Record<string, Tool>>(
	result: StreamTextResult<TOOLS, any>,
	state: { action: Action | null },
	logger: any
): ReadableStream {
	const encoder = new TextEncoder();

	const formatEvent = (chunk: StreamingChunk): Uint8Array => {
		return encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
	};

	const transformStream = new TransformStream<any, Uint8Array>({
		transform(chunk, controller) {
			try {
				switch (chunk.type) {
					case 'text-delta':
						if (chunk.text) {
							controller.enqueue(
								formatEvent({
									type: 'text-delta',
									textDelta: chunk.text,
								})
							);
						}
						break;

					case 'tool-call':
						{
							const toolName = chunk.toolName || 'tool';
							controller.enqueue(
								formatEvent({
									type: 'status',
									message: getToolStatusMessage(toolName),
									category: 'tool',
								})
							);
						}
						break;

					case 'start-step':
					case 'reasoning-delta':
					case 'tool-result':
					case 'finish-step':
					case 'finish':
					case 'start':
					case 'tool-input-start':
					case 'tool-input-delta':
					case 'tool-input-end':
						// Internal chunk types - no logging needed in production
						break;

					default:
						logger.debug('Unhandled chunk type: %s', chunk.type);
				}
			} catch (error) {
				logger.error('Error transforming chunk: %s', error instanceof Error ? error.message : String(error));
				controller.enqueue(
					formatEvent({
						type: 'error',
						error: 'Error processing stream chunk',
						details: error instanceof Error ? error.message : String(error),
					})
				);
			}
		},

		async flush(controller) {
			try {
				// Process tutorial state and fetch complete tutorial data if available
				const finalTutorialData = await handleTutorialState(state, { logger });

				// Send tutorial data if available
				if (finalTutorialData) {
					controller.enqueue(
						formatEvent({
							type: 'tutorial-data',
							tutorialData: finalTutorialData,
						})
					);
				}

				// Send finish signal
				controller.enqueue(formatEvent({ type: 'finish' }));
			} catch (error) {
				logger.error('Error in stream flush: %s', error instanceof Error ? error.message : String(error));
				controller.enqueue(
					formatEvent({
						type: 'error',
						error: 'Sorry, I encountered an error while processing your request. Please try again.',
						details: error instanceof Error ? error.message : String(error),
					})
				);
			}
		},
	});

	return result.fullStream.pipeThrough(transformStream);
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
