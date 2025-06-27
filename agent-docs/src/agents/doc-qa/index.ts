import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import answerQuestion from './rag';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  let jsonRequest: any = null;
  let prompt: string;

  try {
    jsonRequest = await req.data.json();
    prompt = typeof jsonRequest === 'object' && jsonRequest !== null && 'message' in jsonRequest
      ? jsonRequest.message
      : JSON.stringify(jsonRequest);
  } catch {
    prompt = await req.data.text();
  }

  if (prompt === undefined || prompt === null) {
    return resp.text("How can I help you?");
  }

  const answer = await answerQuestion(ctx, prompt);
  return resp.json(answer);
}