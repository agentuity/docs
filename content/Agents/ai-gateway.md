# AI Gateway

When you use something like the Vercel AI SDK or OpenAI's SDK and invoke a model like GPT-5 mini, if you don't provide a key, you don't have to provide one. Without a key, calls are automatically routed through Agentuity's AI Gateway.

## No Keys Required

This lets you play around with a bunch of different models and providers without having to provide your own keys or sign up for individual accounts. Agentuity has higher rate limits and other benefits through the gateway, making it pretty useful and easy to prototype and use stuff with.

## Quick Prototyping

The AI Gateway is great for getting started quickly. You can test and compare different models without any setup friction—no API keys to manage, no provider accounts to create. Just write your code and start making inference calls.

## Using Your Own Keys

If you prefer to use your own API keys, you can set them as environment variables. When provider-specific API keys are configured, requests bypass the gateway and go directly to the provider.
