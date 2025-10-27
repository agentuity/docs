import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import answerQuestion from './rag';
import { ConversationHistorySchema, type ConversationMessage } from './types';

export default async function Agent(
	req: AgentRequest,
	resp: AgentResponse,
	ctx: AgentContext
) {
	let jsonRequest: any = null;
	let prompt: string;
	let conversationHistory: ConversationMessage[] | undefined;

	try {
		jsonRequest = await req.data.json();
		if (
			typeof jsonRequest === 'object' &&
			jsonRequest !== null &&
			'message' in jsonRequest
		) {
			prompt = String(jsonRequest.message || '');
			
			if ('conversationHistory' in jsonRequest) {
				try {
					const validationResult = ConversationHistorySchema.safeParse(
						jsonRequest.conversationHistory
					);
					if (validationResult.success) {
						conversationHistory = validationResult.data;
						ctx.logger.info(
							'Received conversation history with %d messages',
							conversationHistory.length
						);
					} else {
						ctx.logger.warn(
							'Invalid conversation history format, ignoring: %o',
							validationResult.error
						);
					}
				} catch (error) {
					ctx.logger.warn(
						'Error parsing conversation history, ignoring: %o',
						error
					);
				}
			}
		} else {
			prompt = JSON.stringify(jsonRequest);
		}
	} catch {
		prompt = await req.data.text();
	}

	if (!prompt.trim()) {
		return resp.text('How can I help you?');
	}

	const answer = await answerQuestion(ctx, prompt, { conversationHistory });
	return resp.json(answer);
}
