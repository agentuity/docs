import { tool } from "ai";
import { z } from "zod";
import { ActionType } from "./state";
import type { AgentState } from "./state";
import type { AgentContext } from "@agentuity/sdk";
import { getTutorialMeta, getUserTutorialProgress } from "./tutorial";

/**
 * Context passed to tools for state management and logging
 */
interface ToolContext {
    state: AgentState;
    agentContext: AgentContext;
    userId?: string;
}

/**
 * Factory function that creates tools with state management context
 */
export async function createTools(context: ToolContext) {
    const { state, agentContext, userId } = context;
    const DOC_QA_AGENT_NAME = "doc-qa";
    const docQaAgent = await agentContext.getAgent({ name: DOC_QA_AGENT_NAME });
    /**
     * Tool for starting a tutorial - adds action to state queue
     */
    const startTutorialAtStep = tool({
        description: "Start a specific tutorial for the user. You must call this function in order for the user to see the tutorial step content. The tutorial content will be injected to the final response automatically -- you do not have to narrate the tutorial content. The step number should be between 1 and the total number of steps in the tutorial.",
        parameters: z.object({
            tutorialId: z.string().describe("The exact ID of the tutorial to start"),
            stepNumber: z.number().describe("The step number of the tutorial to start (1 to total available steps in the tutorial)")
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
            state.setAction({
                type: ActionType.START_TUTORIAL_STEP,
                tutorialId: tutorialId,
                currentStep: stepNumber,
                totalSteps: tutorialResponse.data.totalSteps
            });
            agentContext.logger.info("Added start_tutorial action to state for: %s at step %d", tutorialId, stepNumber);
            return `Starting "${data.title}". Total steps: ${data.totalSteps} \n\n Description: ${data.description}`;
        },
    });

    /**
     * Tool that talks to docs agent.
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
            // TODO: handle the docs referencing and inject it to the frontend response
            const responseData = await response.data.json();
            return responseData;
        },
    });

    /**
     * Tool to fetch user's tutorial progress
     * This helps the agent understand which tutorials the user has completed or started
     */
    const getUserTutorialProgressTool = tool({
        description: "Fetch the user's tutorial progress to see which tutorials they have started, completed, or not yet begun. Use this when you need to recommend tutorials based on what the user has already done, or when answering questions about topics covered in specific tutorials.",
        parameters: z.object({}),
        execute: async () => {
            if (!userId) {
                agentContext.logger.warn("Cannot fetch tutorial progress: userId not available");
                return "Unable to fetch tutorial progress - user identification not available.";
            }

            agentContext.logger.info("Fetching tutorial progress for user: %s", userId);
            const progressResponse = await getUserTutorialProgress(userId, agentContext);

            if (!progressResponse.success || !progressResponse.data) {
                agentContext.logger.error("Failed to fetch tutorial progress: %s", progressResponse.error);
                return `Unable to fetch tutorial progress at this time.`;
            }

            const progress = progressResponse.data;
            const tutorials = progress.tutorials || {};
            const tutorialList = Object.values(tutorials);

            if (tutorialList.length === 0) {
                return "User has not started any tutorials yet.";
            }

            const completed = tutorialList.filter(t => t.completedAt);
            const inProgress = tutorialList.filter(t => !t.completedAt);

            let summary = `User Tutorial Progress:\n`;
            
            if (completed.length > 0) {
                summary += `\nCompleted Tutorials (${completed.length}):\n`;
                completed.forEach(t => {
                    summary += `  - ${t.tutorialId}: Completed on ${new Date(t.completedAt!).toLocaleDateString()}\n`;
                });
            }

            if (inProgress.length > 0) {
                summary += `\nIn Progress (${inProgress.length}):\n`;
                inProgress.forEach(t => {
                    summary += `  - ${t.tutorialId}: Step ${t.currentStep}/${t.totalSteps}, Last accessed: ${new Date(t.lastAccessedAt).toLocaleDateString()}\n`;
                });
            }

            return summary;
        },
    });

    // Return tools object
    return {
        startTutorialById: startTutorialAtStep,
        queryOtherAgent: askDocsAgentTool,
        getUserTutorialProgress: getUserTutorialProgressTool,
    };
}

export type { ToolContext }; 