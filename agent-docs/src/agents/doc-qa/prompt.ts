import type { AgentContext } from '@agentuity/sdk';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';


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
			maxOutputTokens: 100,
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
