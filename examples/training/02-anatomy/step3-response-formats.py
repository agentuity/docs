from agentuity import AgentRequest, AgentResponse, AgentContext
from datetime import datetime

def welcome():
    return {
        'welcome': 'Learn how to return different response formats (text, markdown, streaming).',
        'prompts': [
            {'data': 'Show text response', 'contentType': 'text/plain'},
            {'data': 'Show markdown response', 'contentType': 'text/plain'},
            {'data': 'Show streaming response', 'contentType': 'text/plain'}
        ]
    }

async def run(request: AgentRequest, response: AgentResponse, context: AgentContext):
    prompt = await request.data.text()

    context.logger.info('Received request', {'prompt': prompt})

    # Plain text response
    if prompt == 'Show text response':
        return response.text('This is a plain text response from your agent.')

    # Note: We've seen response.json() in previous steps

    # Markdown response (formatted text)
    if prompt == 'Show markdown response':
        markdown = f"""# Agent Response

This is a **markdown** response with rich formatting.

## Features
- Lists
- **Bold** and *italic* text
- Code blocks

```json
{{
  "agent": "{context.agent.name}",
  "timestamp": "{datetime.now().isoformat()}"
}}
```"""

        return response.markdown(markdown)

    # Stream response (using the OpenAI Chat Completions API)
    if prompt == 'Show streaming response':
        from openai import AsyncOpenAI
        client = AsyncOpenAI()

        try:
            chat_completion = await client.chat.completions.create(
                model='gpt-5-nano',
                messages=[{
                    'role': 'user',
                    'content': 'Tell me a short story about AI agents. Limit your response to 250 words.'
                }],
                stream=True
            )

            return response.stream(chat_completion, lambda x: x.choices[0].delta.content, contentType='text/markdown')

        except Exception as error:
            context.logger.error(f'Error streaming response: {error}')
            return response.text('Error generating stream', status=500)

    # Note: Use response.empty() when you don't need to send data back (useful for webhooks)

    return response.text('Try one of the example prompts to see different response formats.')
