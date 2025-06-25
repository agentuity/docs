import type { AgentContext } from '@agentuity/sdk';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import type { PromptType } from './types';
import { PromptClassificationSchema } from './types';

/**
 * Determines the prompt type based on the input string using LLM classification.
 * Uses specific, measurable criteria to decide between Normal and Agentic RAG.
 * @param ctx - Agent Context for logging and LLM access
 * @param input - The input string to analyze
 * @returns {Promise<PromptType>} - The determined PromptType
 */
export async function getPromptType(ctx: AgentContext, input: string): Promise<PromptType> {
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

        ctx.logger.info('Prompt classified as %s (confidence: %f): %s', 
            result.object.type, result.object.confidence, result.object.reasoning);

        return result.object.type as PromptType;
        
    } catch (error) {
        ctx.logger.error('Error classifying prompt, defaulting to Normal: %o', error);
        return 'Normal' as PromptType;
    }
}
