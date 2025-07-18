import { tool } from "ai";
import { z } from "zod";
import type { AgentState } from "./state";
import type { AgentContext } from "@agentuity/sdk";
import { getTutorialList } from "./tutorial";

/**
 * Context passed to tools for state management and logging
 */
interface ToolContext {
    state: AgentState;
    agentContext: AgentContext;
}

/**
 * Factory function that creates tools with state management context
 */
export function createTools(context: ToolContext) {
    const { state, agentContext } = context;

    /**
     * Tool for starting a tutorial - adds action to state queue
     */
    const startTutorialTool = tool({
        description: "Start a specific tutorial for the user.",
        parameters: z.object({
            tutorialId: z.string().describe("The ID of the tutorial to start"),
        }),
        execute: async ({ tutorialId }) => {
            agentContext.logger.info("Adding start_tutorial action to state for: %s", tutorialId);
            state.addAction({
                type: "start_tutorial",
                tutorialId
            });
            return `Starting the tutorial.`;
        },
    });

    /**
     * Tool for fetching available tutorials - calls actual API
     */
    const fetchTutorialListTool = tool({
        description: "Get a list of available tutorials",
        parameters: z.object({}),
        execute: async () => {
            try {
                const result = await getTutorialList(agentContext);
                if (result.error) {
                    agentContext.logger.error("Error fetching tutorial list: %s", result.error);
                    return "Encountering problems while fetching tutorial info."
                }
                return result.message;
            } catch (error) {
                agentContext.logger.error("Error fetching tutorials: %s", error);
                return "Sorry, I couldn't fetch the tutorials right now. Please try again later.";
            }
        },
    });

    /**
     * Tool for proceeding to next tutorial step - adds action to state queue
     */
    const nextTutorialStepTool = tool({
        description: "Move to the next step in the current tutorial",
        parameters: z.object({
            tutorialId: z.string().describe("The ID of the current tutorial"),
            currentStep: z.number().describe("The current step number"),
        }),
        execute: async ({ tutorialId, currentStep }) => {
            agentContext.logger.info("Adding next_step action to state for: %s, step: %d", tutorialId, currentStep);
            state.addAction({
                type: "next_step",
                tutorialId,
                currentStep
            });
            return `I'll move you to the next step in the tutorial!`;
        },
    });

    /**
     * Tool for talking to other agents (non-tutorial functionality)
     * This tool doesn't use state - it returns data directly
     */
    const askDocsAgentTool = tool({
        description: "Query the Agentuity Development Documentation agent using RAG (Retrieval Augmented Generation) to get relevant documentation and answers about the Agentuity platform, APIs, and development concepts",
        parameters: z.object({
            query: z.string().describe("The question or query to send to the query function"),
        }),
        execute: async ({ query }) => {
            //TODO: we have to do agent hand-off here
            agentContext.logger.info("Querying agent %s with: %s", query);
            return `Response from Agentuity Docs for query: ${query}`;
        },
    });

    /**
     * TODO: This tool allow the agent to get details information about the code execution that the user performed.
     */
    const fetchCodeExecutionResultTool = tool({
        description: "Fetch code execution results from the frontend",
        parameters: z.object({
            executionId: z.string().describe("The ID of the code execution"),
        }),
        execute: async ({ executionId }) => {
            agentContext.logger.info("Fetching execution result for: %s", executionId);
            // This would actually fetch execution results
            // For now, just return a mock response
            return `Result for execution ${executionId}: console.log('Hello, World!');\n// Output: Hello, World!`;
        },
    });

    // Return tools object
    return {
        startTutorial: startTutorialTool,
        fetchTutorialList: fetchTutorialListTool,
        nextTutorialStep: nextTutorialStepTool,
        queryOtherAgent: askDocsAgentTool,
    };
}

export type { ToolContext }; 