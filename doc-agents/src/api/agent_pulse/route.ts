import { createRouter, sse } from '@agentuity/runtime';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { buildContext, buildSystemPrompt } from '@agent/agent_pulse/context-builder';
import { createTools } from '@agent/agent_pulse/tools';
import type { ConversationMessage, StreamingChunk } from '@agent/agent_pulse/types';

interface ParsedRequest {
	message: string;
	conversationHistory: ConversationMessage[];
	tutorialData?: { tutorialId: string; currentStep: number };
}

function parseAgentRequest(jsonData: any): ParsedRequest {
	let message = '';
	let conversationHistory: ConversationMessage[] = [];
	let tutorialData: any = undefined;

	if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData)) {
		const body = jsonData as any;
		message = body.message || '';
		if (Array.isArray(body.conversationHistory)) {
			conversationHistory = body.conversationHistory.map((msg: any) => ({
				author: (msg.author || msg.role || 'USER').toUpperCase(),
				content: msg.content || '',
			}));
		}
		tutorialData = body.tutorialData || undefined;
	} else {
		message = String(jsonData || '');
	}

	return {
		message,
		conversationHistory,
		tutorialData,
	};
}

const router = createRouter();

// POST /api/agent-pulse
router.post(
	'/',
	sse(async (c, stream) => {
		const logger = c.var.logger;

		try {
			const jsonData = await c.req.json();
			const parsedRequest = parseAgentRequest(jsonData);

			logger.info('AgentPulse received message: %s', parsedRequest.message);

			// Create state for managing actions
			const state = { action: null as any };

			// Build messages for the conversation
			const messages: ConversationMessage[] = [...parsedRequest.conversationHistory, { author: 'USER', content: parsedRequest.message }];

			// Create tools with state context
			const tools = await createTools(state, {
				logger,
				// Provide minimal context for tutorial fetching
			} as any);

			// Build tutorial context and system prompt
			const tutorialContext = await buildContext(
				{
					logger,
				} as any,
				parsedRequest.tutorialData
			);
			const systemPrompt = await buildSystemPrompt(tutorialContext, {
				logger,
			} as any);

			// Generate streaming response
			const result = await streamText({
				model: openai('gpt-4.1'),
				messages: messages.map((msg) => ({
					role: msg.author === 'USER' ? 'user' : 'assistant',
					content: msg.content,
				})),
				tools,
				system: systemPrompt,
			});

			// Stream the response
			for await (const chunk of result.fullStream) {
				if (chunk.type === 'text-delta') {
					const sseChunk: StreamingChunk = {
						type: 'text-delta',
						textDelta: chunk.text,
					};
					stream.writeSSE({ data: JSON.stringify(sseChunk) });
				} else if (chunk.type === 'tool-call') {
					const toolName = chunk.toolName || 'tool';
					const userFriendlyMessage = getToolStatusMessage(toolName);
					const sseChunk: StreamingChunk = {
						type: 'status',
						message: userFriendlyMessage,
						category: 'tool',
					};
					stream.writeSSE({ data: JSON.stringify(sseChunk) });
					logger.debug('Tool called: %s', toolName);
				} else if (chunk.type === 'reasoning-delta') {
					logger.debug('REASONING: %s', chunk);
				} else {
					logger.debug('Skipping chunk type: %s', chunk.type);
				}
			}

			// Send tutorial data if available
			if (state.action) {
				const tutorialChunk: StreamingChunk = {
					type: 'tutorial-data',
					tutorialData: state.action,
				};
				stream.writeSSE({ data: JSON.stringify(tutorialChunk) });
			}

			// Send finish signal
			const finishChunk: StreamingChunk = {
				type: 'finish',
			};
			stream.writeSSE({ data: JSON.stringify(finishChunk) });
		} catch (error) {
			logger.error('Agent request failed: %s', error instanceof Error ? error.message : String(error));
			const errorChunk: StreamingChunk = {
				type: 'error',
				error: 'Sorry, I encountered an error while processing your request. Please try again.',
				details: error instanceof Error ? error.message : String(error),
			};
			stream.writeSSE({ data: JSON.stringify(errorChunk) });
		}
	})
);

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

export default router;
