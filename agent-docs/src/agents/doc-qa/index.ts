import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { getPromptType } from './prompt';
import answerQuestion from './rag';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const prompt = await req.data.text();
  const promptType = await getPromptType(ctx, prompt);
  ctx.logger.info(`Receive user prompt with type: ${promptType}`);
  const answer = await answerQuestion(ctx, prompt);
  return resp.json(answer);
}