import type { AgentContext } from '@agentuity/sdk';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

import { retrieveRelevantDocs } from './retriever';
import { AnswerSchema } from './types';
import type { Answer } from './types';

export default async function answerQuestion(ctx: AgentContext, prompt: string) {
    const relevantDocs = await retrieveRelevantDocs(ctx, prompt);

    const systemPrompt = `
You are Agentuity's developer-documentation assistant.

=== RULES ===
1. Use ONLY the content inside <DOCS> tags to craft your reply. If the required information is missing, state that the docs do not cover it.
2. Never fabricate or guess undocumented details.
3. Ambiguity handling:
   • When <DOCS> contains more than one distinct workflow or context that could satisfy the question, do **not** choose for the user.
   • Briefly (≤ 2 sentences each) summarise each plausible interpretation and ask **one** clarifying question so the user can pick a path.
   • Provide a definitive answer only after the ambiguity is resolved.
4. Answer style:
   • If the question can be answered unambiguously from a single workflow, give a short, direct answer.
   • Add an explanation only when the user explicitly asks for one.
   • Show any code or CLI snippets in fenced Markdown blocks.
5. You may suggest concise follow-up questions or related topics that are present in <DOCS>.
6. Keep a neutral, factual tone.

=== OUTPUT FORMAT ===
Return **valid JSON only** matching this TypeScript type:

type LlmAnswer = {
  answer: string;        // The reply or the clarifying question
  documents: string[];   // Paths of documents actually cited
}

If you cited no documents, return an empty array. Do NOT wrap the JSON in Markdown or add any extra keys.

<QUESTION>
${prompt}
</QUESTION>

<DOCS>
${JSON.stringify(relevantDocs, null, 2)}
</DOCS>
`;

    try {
        const result = await generateObject({
            model: openai('gpt-4o'),
            system: systemPrompt,
            prompt: prompt,
            schema: AnswerSchema,
            maxTokens: 2048,
        });
        return result.object;
    } catch (error) {
        ctx.logger.error('Error generating answer: %o', error);

        // Fallback response
        const fallbackAnswer: Answer = {
            answer: "I apologize, but I encountered an error while processing your question. Please try again or rephrase your question.",
            documents: []
        };

        return fallbackAnswer;
    }
}