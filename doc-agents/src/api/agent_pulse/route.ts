import { createRouter } from '@agentuity/runtime';
import { cookieAuth } from '@middleware/auth';
import { config } from '../../../config';
import agentPulse from '@agent/agent_pulse';
import type { ConversationMessage } from '@agent/agent_pulse/types';
import {
	getCurrentTutorialState,
	updateTutorialProgress,
} from '../../services/tutorial-state-manager';
import {
	withPersistence,
	type Session,
	type TutorialData,
} from '../../services/stream-persistence';

interface ParsedRequest {
	message: string;
	sessionId?: string;
	conversationHistory: ConversationMessage[];
	tutorialData?: { tutorialId: string; currentStep: number };
}

/**
 * Parses and validates incoming agent requests
 */
function parseAgentRequest(jsonData: unknown): ParsedRequest {
	let message = '';
	let sessionId: string | undefined = undefined;
	let conversationHistory: ConversationMessage[] = [];
	let tutorialData: { tutorialId: string; currentStep: number } | undefined = undefined;

	if (jsonData && typeof jsonData === 'object' && !Array.isArray(jsonData)) {
		const body = jsonData as Record<string, unknown>;
		message = typeof body.message === 'string' ? body.message : '';
		sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined;

		if (Array.isArray(body.conversationHistory)) {
			conversationHistory = body.conversationHistory.map((msg: unknown) => {
				const m = msg as Record<string, unknown>;
				return {
					author: String(m.author || m.role || 'USER').toUpperCase() as 'USER' | 'ASSISTANT',
					content: typeof m.content === 'string' ? m.content : '',
				};
			});
		}

		if (body.tutorialData && typeof body.tutorialData === 'object') {
			const td = body.tutorialData as Record<string, unknown>;
			if (typeof td.tutorialId === 'string' && typeof td.currentStep === 'number') {
				tutorialData = {
					tutorialId: td.tutorialId,
					currentStep: td.currentStep,
				};
			}
		}
	} else if (typeof jsonData === 'string') {
		message = jsonData;
	}

	return {
		message,
		sessionId,
		conversationHistory,
		tutorialData,
	};
}

/**
 * Generate title for a session (async, non-blocking)
 */
async function generateAndPersistTitle(
	sessionKey: string,
	finalSession: Session,
	kv: any,
	logger: any
): Promise<void> {
	try {
		if (finalSession.title) {
			return; // Title already set
		}

		// Build compact conversation history
		const HISTORY_LIMIT = 10;
		const MAX_CONTENT_LEN = 400;
		const history = finalSession.messages.slice(-HISTORY_LIMIT).map((m) => ({
			author: m.author,
			content: (m.content || '').slice(0, MAX_CONTENT_LEN),
		}));

		// Call title generator endpoint internally
		const { generateText } = await import('ai');
		const { openai } = await import('@ai-sdk/openai');

		const historyText = history
			.map((m) => `${m.author}: ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`)
			.join('\n');

		const prompt = `Generate a very short session title summarizing the conversation topic.

Requirements:
- sentence case
- no emojis
- <= 60 characters
- no quotes or markdown
- output the title only, no extra text

Conversation:
${historyText}`;

		const response = await generateText({
			model: openai('gpt-4o-mini'),
			prompt,
			system:
				'You are a title generator for chat sessions. Generate concise, descriptive titles only. Output only the title text, nothing else.',
		});

		let title = response.text.trim();
		// Sanitize
		if (
			(title.startsWith('"') && title.endsWith('"')) ||
			(title.startsWith("'") && title.endsWith("'"))
		) {
			title = title.slice(1, -1).trim();
		}
		if (title.length > 60) title = title.slice(0, 60).trim();
		title = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();

		// Re-fetch and set title only if still empty
		const latest = await (kv.get as (store: string, key: string) => Promise<{ exists: boolean; data?: Session }>)(config.kvStoreName, sessionKey);
		if (!latest.exists || !latest.data) return;
		const current = latest.data;
		if (current.title) return;
		current.title = title || 'New chat';
		await kv.set(config.kvStoreName, sessionKey, current);

		logger.info('Generated title for session %s: %s', sessionKey, title);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		logger.error('Title generation failed: %s', msg);
	}
}

const router = createRouter();

const SSE_HEADERS = {
	'Content-Type': 'text/event-stream',
	'Cache-Control': 'no-cache',
	Connection: 'keep-alive',
};

// POST /api/agent-pulse
router.post('/', cookieAuth, async (c) => {
	try {
		const userId = (c.get as (key: string) => string)('userId');
		const kv = c.var.kv;
		const logger = c.var.logger;

		const jsonData = await c.req.json();
		const parsedRequest = parseAgentRequest(jsonData);

		// Validate request
		if (!parsedRequest.message || parsedRequest.message.trim() === '') {
			return c.json({ error: 'Message is required' }, { status: 400 });
		}

		// Get current tutorial state if not provided
		let tutorialData = parsedRequest.tutorialData;
		if (!tutorialData && userId) {
			tutorialData = (await getCurrentTutorialState(userId, kv)) || undefined;
		}

		// Run agent and get stream
		const agentStream = await agentPulse.run({
			message: parsedRequest.message,
			conversationHistory: parsedRequest.conversationHistory,
			tutorialData,
		});

		// If no sessionId provided, return raw stream (no persistence)
		if (!parsedRequest.sessionId) {
			return new Response(agentStream, { headers: SSE_HEADERS });
		}

		// Wrap stream with persistence
		const persistedStream = withPersistence(agentStream, {
			kv,
			userId,
			sessionId: parsedRequest.sessionId,
			kvStoreName: config.kvStoreName,
			logger,
			onTutorialProgress: async (td: TutorialData) => {
				if (userId && td.tutorialId) {
					await updateTutorialProgress(userId, td.tutorialId, td.currentStep, td.totalSteps ?? 0, kv);
				}
			},
			onSessionSaved: (session: Session) => {
				// Fire and forget title generation
				const sessionKey = `${userId}_${parsedRequest.sessionId}`;
				void generateAndPersistTitle(sessionKey, session, kv, logger);
			},
		});

		return new Response(persistedStream, { headers: SSE_HEADERS });
	} catch (error) {
		c.var.logger.error(
			'Agent request failed: %s',
			error instanceof Error ? error.message : String(error)
		);

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
