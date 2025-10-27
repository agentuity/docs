import type { AgentContext } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';

import type { PromptType, ConversationMessage } from './types';
import { PromptClassificationSchema } from './types';

export async function rephraseVaguePrompt(
	ctx: AgentContext,
	input: string
): Promise<string> {
	const systemPrompt = `You are a technical documentation search assistant for developer tools and AI agents. Your job is to CAREFULLY improve unclear queries ONLY when absolutely necessary.

BE EXTREMELY CONSERVATIVE. Most queries should be returned UNCHANGED.

ONLY rephrase if the query contains:
1. OBVIOUS acronyms that need expansion (SDK, API, CLI, UI, KV, HTTP, REST, JSON, XML)
2. Very vague single words like "error", "setup", "install" without context

NEVER change or "correct" these technical terms (return them exactly as written):
- bun, node, deno (JavaScript runtimes)
- react, vue, angular, svelte (frameworks) 
- typescript, javascript, python, rust (languages)
- docker, kubernetes, aws, gcp (platforms)
- Any proper nouns or brand names

When rephrasing:
- Keep the original technical terms EXACTLY as written
- Only add minimal context for clarity
- Don't assume what the user meant
- Don't add implementation details

Examples of GOOD rephrasing:
- "SDK setup" → "SDK setup installation configuration"
- "API error" → "API error handling troubleshooting"
- "CLI install" → "CLI installation setup"

Examples of what to LEAVE UNCHANGED:
- "bun example agent" → "bun example agent" (bun is a known runtime)
- "react component" → "react component" (already clear)
- "node server setup" → "node server setup" (already specific enough)
- "typescript agent" → "typescript agent" (clear technical terms)

If in doubt, return the query UNCHANGED. Better to leave it as-is than to misinterpret the user's intent.

Return ONLY the query text, nothing else.`;

	try {
		const result = await generateText({
			model: openai('gpt-4o-mini'),
			system: systemPrompt,
			prompt: `User query: "${input}"`,
			maxTokens: 100,
			temperature: 0.1,
		});

		const rephrasedQuery = result.text?.trim() || input;
		// Log if we actually rephrased it
		if (rephrasedQuery !== input) {
			ctx.logger.info(
				'Rephrased query from "%s" to "%s"',
				input,
				rephrasedQuery
			);
		}

		return rephrasedQuery;
	} catch (error) {
		ctx.logger.error('Error rephrasing prompt, returning original: %o', error);
		return input;
	}
}

/**
 * Helper function to sanitize and truncate conversation history
 * Takes last N messages and truncates content to avoid token bloat
 */
function sanitizeConversationHistory(
	history: ConversationMessage[],
	maxMessages = 10,
	maxContentLength = 400
): ConversationMessage[] {
	if (!history || history.length === 0) {
		return [];
	}

	const recentHistory = history.slice(-maxMessages);

	return recentHistory.map((msg) => {
		let content = msg.content || '';
		
		content = content.replace(/```[\s\S]*?```/g, '[code block]');
		
		if (content.length > maxContentLength) {
			content = content.slice(0, maxContentLength) + '...';
		}

		return {
			author: msg.author,
			content: content.trim(),
		};
	});
}

/**
 * Rewrites a query using conversation history to make follow-up questions standalone.
 * Only rewrites when the query is elliptical or references prior turns.
 * Otherwise returns the original query unchanged.
 */
export async function rewriteQueryWithHistory(
	ctx: AgentContext,
	input: string,
	conversationHistory: ConversationMessage[]
): Promise<string> {
	if (!conversationHistory || conversationHistory.length < 2) {
		ctx.logger.info('No conversation history, skipping query rewriting');
		return input;
	}

	const sanitizedHistory = sanitizeConversationHistory(conversationHistory);

	const systemPrompt = `You are a query rewriting assistant for a technical documentation search system.

Your job is to rewrite follow-up questions into standalone queries ONLY when necessary.

BE EXTREMELY CONSERVATIVE. Most queries should be returned UNCHANGED.

ONLY rewrite if the query:
1. Contains pronouns or references that need context (e.g., "that", "it", "this", "those", "them")
2. Is elliptical or incomplete (e.g., "and for Python?", "what about CLI?", "how do I do it?")
3. References previous conversation implicitly (e.g., "can you explain more?", "show me an example")

DO NOT rewrite if the query:
- Is already a complete, standalone question
- Contains all necessary context
- Is a new topic unrelated to previous messages

When rewriting:
- Incorporate relevant context from the conversation history
- Keep technical terms EXACTLY as written
- Make the query standalone and clear
- Don't add assumptions or implementation details
- Keep it concise

Examples of GOOD rewriting:
History: [USER: "How do I create an agent?", ASSISTANT: "Use agentuity agent create..."]
Query: "What about in Python?" → "How do I create an agent in Python?"

History: [USER: "Tell me about the SDK", ASSISTANT: "The SDK provides..."]
Query: "How do I install it?" → "How do I install the Agentuity SDK?"

Examples of what to LEAVE UNCHANGED:
Query: "How do I use the CLI?" → "How do I use the CLI?" (already complete)
Query: "What is vector storage?" → "What is vector storage?" (new topic, complete)
Query: "Show me agent examples" → "Show me agent examples" (clear and standalone)

Return ONLY the rewritten query text (or original if no rewriting needed), nothing else.`;

	try {
		const historyText = sanitizedHistory
			.map((msg) => `${msg.author}: ${msg.content}`)
			.join('\n');

		const result = await generateText({
			model: openai('gpt-4o-mini'),
			system: systemPrompt,
			prompt: `Conversation history:\n${historyText}\n\nCurrent query: "${input}"\n\nRewrite the query if needed, or return it unchanged if it's already standalone:`,
			maxTokens: 150,
			temperature: 0,
		});

		const rewrittenQuery = result.text?.trim() || input;

		// Log if we actually rewrote it
		if (rewrittenQuery !== input) {
			ctx.logger.info(
				'Rewrote query with history from "%s" to "%s"',
				input,
				rewrittenQuery
			);
		} else {
			ctx.logger.info('Query already standalone, no rewriting needed');
		}

		return rewrittenQuery;
	} catch (error) {
		ctx.logger.error(
			'Error rewriting query with history, returning original: %o',
			error
		);
		return input;
	}
}

/**
 * Determines the prompt type based on the input string using LLM classification.
 * Uses specific, measurable criteria to decide between Normal and Agentic RAG.
 * @param ctx - Agent Context for logging and LLM access
 * @param input - The input string to analyze
 * @returns {Promise<PromptType>} - The determined PromptType
 */
export async function getPromptType(
	ctx: AgentContext,
	input: string
): Promise<PromptType> {
	const systemPrompt = `
You are a query classifier that determines whether a user question requires simple retrieval (Normal) or complex reasoning (Thinking).

Use these SPECIFIC criteria for classification:

**THINKING (Agentic RAG) indicators:**
- Multi-step reasoning required (e.g., "compare and contrast", "analyze pros/cons")  
- Synthesis across multiple concepts (e.g., "how does X relate to Y")
- Scenario analysis (e.g., "what would happen if...", "when should I use...")
- Troubleshooting/debugging questions requiring logical deduction
- Questions with explicit reasoning requests ("explain why", "walk me through")
- Comparative analysis ("which is better for...", "what are the trade-offs")

**NORMAL (Simple RAG) indicators:**
- Direct factual lookups (e.g., "what is...", "how do I install...")
- Simple how-to questions with clear answers
- API reference queries  
- Configuration/syntax questions
- Single-concept definitions

Respond with a JSON object containing:
- type: "Normal" or "Thinking"  
- confidence: 0.0-1.0 (how certain you are)
- reasoning: brief explanation of your classification

Be conservative - when in doubt, default to "Normal" for better performance.`;

	try {
		const result = await generateObject({
			model: openai('gpt-4o-mini'), // Use faster model for classification
			system: systemPrompt,
			prompt: `Classify this user query: "${input}"`,
			schema: PromptClassificationSchema,
			maxTokens: 200,
		});

		ctx.logger.info(
			'Prompt classified as %s (confidence: %f): %s',
			result.object.type,
			result.object.confidence,
			result.object.reasoning
		);

		return result.object.type as PromptType;
	} catch (error) {
		ctx.logger.error(
			'Error classifying prompt, defaulting to Normal: %o',
			error
		);
		return 'Normal' as PromptType;
	}
}
