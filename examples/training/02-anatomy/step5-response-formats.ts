import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const data = await request.data.json();
  const format = data.format || 'json';

  context.logger.info('Generating response', { format });

  // Return different formats based on request
  if (format === 'json') {
    return response.json({
      type: 'json',
      message: 'This is a JSON response',
      data: {
        agent: context.agent.name,
        timestamp: new Date().toISOString()
      }
    });
  } else if (format === 'text') {
    return response.text('This is a plain text response from your agent.');
  } else if (format === 'html') {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Agent Response</title></head>
        <body>
          <h1>HTML Response</h1>
          <p>This is an HTML response from your agent.</p>
          <p>Agent: ${context.agent.name}</p>
        </body>
      </html>
    `;
    return response.html(html);
  } else if (format === 'empty') {
    // Empty responses are useful for webhooks that don't need data back
    return response.empty();
  } else {
    return response.json({
      error: 'Unknown format',
      supportedFormats: ['json', 'text', 'html', 'empty'],
      requested: format
    });
  }
}
