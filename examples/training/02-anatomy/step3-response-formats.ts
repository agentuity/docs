import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const prompt = await request.data.text();

  context.logger.info('Received request', { prompt });

  // Plain text response
  if (prompt === 'Show text response') {
    return response.text('This is a plain text response from your agent.');
  }

  // Note: We've seen response.json() in previous steps

  // Markdown response (formatted text)
  if (prompt === 'Show markdown response') {
    const markdown = `# Agent Response

This is a **markdown** response with rich formatting.

## Features
- Lists
- **Bold** and *italic* text
- Code blocks

\`\`\`json
{
  "agent": "${context.agent.name}",
  "timestamp": "${new Date().toISOString()}"
}
\`\`\``;

    return response.markdown(markdown);
  }

  // Stream response (using the Vercel AI SDK)
  if (prompt === 'Show streaming response') {
    const result = await streamText({
      model: openai('gpt-5-nano'),
      prompt: 'Tell me a short story about AI agents. Limit your response to 250 words.'
    });

    return response.stream(result.textStream, 'text/markdown');
  }

  // Note: Use response.empty() when you don't need to send data back (useful for webhooks)

  return response.text('Try one of the example prompts to see different response formats.');
}

export const welcome = () => ({
  welcome: 'Learn how to return different response formats (text, markdown, streaming).',
  prompts: [
    { data: 'Show text response', contentType: 'text/plain' },
    { data: 'Show markdown response', contentType: 'text/plain' },
    { data: 'Show streaming response', contentType: 'text/plain' }
  ]
});
