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
        description: `
        Start or navigate a tutorial for the user. 
        This function should be called whenever the user wants to:
        - start a tutorial
        - continue to the next step
        - go back to a previous step
        - jump to a specific step
    
        The function automatically injects tutorial content into the final response. 
        You do NOT need to describe the tutorial content yourself. 
        On success, return the tutorial title, total number of steps, and description.
        If something goes wrong (e.g., invalid step), return a short 3–5 word error message.
      `,
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

            // Guard: reject invalid step numbers (steps are 1-indexed)
            if (stepNumber < 1) {
                return `Step number must be 1 or greater. You requested step ${stepNumber}.`;
            }

            // Guard: reject steps beyond tutorial length
            if (stepNumber > totalSteps) {
                return `This tutorial only has ${totalSteps} step${totalSteps === 1 ? '' : 's'}. You requested step ${stepNumber}.`;
            }
            state.setAction({
                type: ActionType.START_TUTORIAL_STEP,
                tutorialId: tutorialId,
                currentStep: stepNumber,
                totalSteps: tutorialResponse.data.totalSteps
            });
            agentContext.logger.info("Added start_tutorial action to state for: %s at step %d", tutorialId, stepNumber);
            return `Starting "${data.title}". Total steps: ${data.totalSteps} \n\n Description: ${data.description}`;
        }
    });

    /**
     * Tool that talks to docs agent.
     * This tool automatically sends the documentation answer directly to the user - no need to repeat it
     */
    const askDocsAgentTool = tool({
        description: `Query the Agentuity Development Documentation agent using RAG (Retrieval Augmented Generation).

USE THIS TOOL when users ask about:
- Agentuity SDK objects (AgentContext, AgentRequest, AgentResponse)
- SDK methods (ctx.logger, ctx.vector, ctx.kv, resp.json, resp.stream, etc.)
- Platform features (deployment, authentication, agent configuration, etc.)
- CLI commands (agentuity agent create, deploy, etc.)
- Agentuity APIs and development workflows (e.g. agent.run, agent.create, etc.)

IMPORTANT: The documentation answer and references are automatically sent directly to the user (similar to how tutorials work). 
You do NOT need to repeat or paraphrase the documentation content. Just call this tool and let the system handle delivery.
After calling this tool, you can optionally add brief context or follow-up questions, but do not repeat the documentation answer itself.

This tool provides authoritative, up-to-date documentation specific to the Agentuity platform.`,
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
        askDocsAgentTool: askDocsAgentTool,
        getUserTutorialProgress: getUserTutorialProgressTool,
    };
}

export type { ToolContext }; 