import { createAgent } from '@agentuity/runtime';
import { s } from '@agentuity/schema';

const agent = createAgent('AgentPulse', {
	description: 'Multi-turn tutorial and documentation assistant using LLM with tools for tutorial navigation and documentation search',
	schema: {
		input: s.object({
			message: s.string().describe('The user message or query'),
			conversationHistory: s.optional(
				s.array(
					s.object({
						author: s.union(s.literal('USER'), s.literal('ASSISTANT')),
						content: s.string(),
					})
				)
			).describe('Previous conversation messages for context'),
			tutorialData: s.optional(
				s.object({
					tutorialId: s.string(),
					currentStep: s.number(),
				})
			).describe('Current tutorial state if user is in a tutorial'),
		}),
		output: s.object({
			message: s.string().describe('The assistant response'),
			tutorialAction: s.optional(
				s.object({
					type: s.literal('START_TUTORIAL_STEP'),
					tutorialId: s.string(),
					currentStep: s.number(),
					totalSteps: s.number(),
				})
			).describe('Tutorial action if agent initiated a tutorial'),
		}),
	},
	handler: async (ctx, input) => {
		ctx.logger.info('AgentPulse received message: %s', input.message);

		// For now, return a placeholder response
		// The streaming and LLM logic will be handled in the API route
		return {
			message: 'AgentPulse is processing your request...',
		};
	},
});

export default agent;
