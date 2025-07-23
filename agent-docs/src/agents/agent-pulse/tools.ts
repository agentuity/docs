import { tool } from "ai";
import { z } from "zod";
import { ActionType } from "./state";
import type { AgentState } from "./state";
import type { AgentContext, AgentResponse } from "@agentuity/sdk";
import { getTutorialMeta } from "./tutorial";

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
export async function createTools(context: ToolContext) {
    const { state, agentContext } = context;
    const DOC_QA_AGENT_NAME = "doc-qa";
    const docQaAgent = await agentContext.getAgent({ name: DOC_QA_AGENT_NAME });
    /**
     * Tool for starting a tutorial - adds action to state queue
     */
    const startTutorialAtStep = tool({
        description: "Start a specific tutorial for the user. This will validate the tutorial exists, modify user data state, and finally return information about the tutorial including its title, total steps, and description. The tutorial will be displayed to the user automatically. The step number should be between 1 and the total number of steps in the tutorial.",
        parameters: z.object({
            tutorialId: z.string().describe("The exact ID of the tutorial to start"),
            stepNumber: z.number().describe("The step number of the tutorial to start (must be between 1 and total steps)")
        }),
        execute: async ({ tutorialId, stepNumber }) => {
            // Validate tutorial exists before starting
            const tutorialResponse = await getTutorialMeta(tutorialId, agentContext);
            if (!tutorialResponse.success || !tutorialResponse.data) {
                return `Error fetching tutorial information`;
            }

            const data = tutorialResponse.data
            const totalSteps = tutorialResponse.data.totalSteps;
            if (stepNumber > totalSteps) {
                return `This tutorial only has ${totalSteps} steps. You either reached the end of the tutorial or selected an incorrect step number.`;
            }

            agentContext.logger.info("Adding start_tutorial action to state for: %s at step %d", tutorialId, stepNumber);
            state.setAction({
                type: ActionType.START_TUTORIAL_STEP,
                tutorialId: tutorialId,
                currentStep: stepNumber,
                totalSteps: tutorialResponse.data.totalSteps
            });
            return `Starting "${data.title}". Total steps: ${data.totalSteps} \n\n Description: ${data.description}`;
        },
    });

    /**
     * Tool for talking to other agents (nong-tutorial functionality)
     * This tool doesn't use state - it returns data directly
     */
    const askDocsAgentTool = tool({
        description: "Query the Agentuity Development Documentation agent using RAG (Retrieval Augmented Generation) to get relevant documentation and answers about the Agentuity platform, APIs, and development concepts",
        parameters: z.object({
            query: z.string().describe("The question or query to send to the query function"),
        }),
        execute: async ({ query }) => {
            agentContext.logger.info("Querying agent %s with: %s", DOC_QA_AGENT_NAME, query);
            const agentPayload = {
                message: query,

            }
            const response = await docQaAgent.run({
                data: agentPayload,
                contentType: 'application/json'
            })
            console.log(await response.data.json());
            const responseData = await response.data.json();
            return responseData;
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
        startTutorialById: startTutorialAtStep,
        queryOtherAgent: askDocsAgentTool,
    };
}

export type { ToolContext }; 