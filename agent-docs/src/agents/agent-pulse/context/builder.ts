import type { AgentContext } from "@agentuity/sdk";

/**
 * Builds the system prompt for the Agent Pulse assistant using the Prompt Library.
 * 
 * @param tutorialContext - Context information about available tutorials and user progress
 * @param ctx - Agent context providing access to the prompt library
 * @returns The complete system prompt string
 */
export async function buildSystemPrompt(tutorialContext: string, ctx: AgentContext): Promise<string> {
        try {
                // Get the prompt from the prompt library
                const prompt = ctx.prompts.getPrompt('agent-pulse-system');

                // Generate the system prompt with the required tutorialContext variable
                const systemPrompt = prompt.system({
                        tutorialContext: tutorialContext
                });

                return systemPrompt;
        } catch (error) {
                ctx.logger.error("Failed to build system prompt: %s", error instanceof Error ? error.message : String(error));
                throw error; // Re-throw for centralized handling
        }
}

