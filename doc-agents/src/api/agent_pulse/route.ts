import { createRouter } from '@agentuity/runtime';
import agentPulse from '@agent/agent_pulse';
import type { ConversationMessage } from '@agent/agent_pulse/types';

interface ParsedRequest {
	message: string;
	conversationHistory: ConversationMessage[];
	tutorialData?: { tutorialId: string; currentStep: number };
}

/**
 * Parses and validates incoming agent requests
 */
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
router.post('/', async (c) => {
	try {
		const jsonData = await c.req.json();
		const parsedRequest = parseAgentRequest(jsonData);

		// Validate request
		if (!parsedRequest.message || parsedRequest.message.trim() === '') {
			return c.json(
				{
					error: 'Message is required',
				},
				{ status: 400 }
			);
		}

		// Run agent and get stream
		const stream = await agentPulse.run({
			message: parsedRequest.message,
			conversationHistory: parsedRequest.conversationHistory,
			tutorialData: parsedRequest.tutorialData,
		});

		// Return streaming response with proper headers
		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
			},
		});
	} catch (error) {
		c.var.logger.error('Agent request failed: %s', error instanceof Error ? error.message : String(error));

		// Determine if it's a client error (4xx) or server error (5xx)
		const statusCode = error instanceof Error && error.message.includes('Invalid') ? 400 : 500;

		return c.json(
			{
				error: 'Sorry, I encountered an error while processing your request. Please try again.',
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: statusCode }
		);
	}
});

export default router;
