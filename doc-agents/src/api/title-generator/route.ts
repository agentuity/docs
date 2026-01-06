import { createRouter } from '@agentuity/runtime';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const router = createRouter();

interface ConversationMessage {
	author: 'USER' | 'ASSISTANT';
	content: string;
}

function sanitizeTitle(input: string): string {
	if (!input) return '';
	let s = input.trim();
	// Strip wrapping quotes/backticks
	if (
		(s.startsWith('"') && s.endsWith('"')) ||
		(s.startsWith("'") && s.endsWith("'")) ||
		(s.startsWith('`') && s.endsWith('`'))
	) {
		s = s.slice(1, -1).trim();
	}
	// Remove markdown emphasis
	s = s.replace(/\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_/g, (_m, a, b, c, d) => a || b || c || d || '');
	// Remove emojis (basic unicode emoji ranges)
	s = s.replace(/[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
	// Collapse whitespace
	s = s.replace(/\s+/g, ' ').trim();
	// Sentence case
	s = sentenceCase(s);
	// Trim trailing punctuation noise
	s = s.replace(/[\s\-–—:;,\.]+$/g, '').trim();
	// Enforce 60 chars
	if (s.length > 60) s = s.slice(0, 60).trim();
	return s;
}

function sentenceCase(str: string): string {
	if (!str) return '';
	const lower = str.toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function formatHistory(messages: ConversationMessage[]): string {
	return messages
		.map(
			(m) =>
				`${m.author}: ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`
		)
		.join('\n');
}

// POST /api/title-generator
router.post('/', async (c) => {
	try {
		const body = await c.req.json();
		const conversationHistory = body.conversationHistory as ConversationMessage[];

		if (!conversationHistory || !Array.isArray(conversationHistory)) {
			return c.json({ error: 'conversationHistory is required and must be an array' }, 400);
		}

		if (conversationHistory.length === 0) {
			return c.json({ title: 'New chat' });
		}

		const historyText = formatHistory(conversationHistory);
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

		const title = sanitizeTitle(response.text);

		return c.json({
			title: title || 'New chat',
		});
	} catch (error) {
		c.var.logger.error('Title generation failed: %s', error);
		return c.json(
			{
				error: 'Failed to generate title',
				details: error instanceof Error ? error.message : String(error),
			},
			500
		);
	}
});

export default router;
