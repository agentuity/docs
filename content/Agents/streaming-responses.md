# Streaming Responses

One of the things that makes Agentuity unique is the different types of streaming support and how easy they make it. Since ChatGPT 3.5, we've learned that streaming tokens appearing on the page is a really important UX paradigm because some agents can take a while to respond. Streaming to the frontend is really useful—though it's not the only use case, there are a bunch of use cases for streaming.

## Native Streaming

For Agentuity, streaming is native. Everything is technically streamed under the hood. There are a bunch of helpers provided to stream things, watch tokens as they come through, and hooks into the streams for fine-grained control.

## Ephemeral Streaming

Ephemeral streams provide direct streaming to the HTTP client. Data flows through in real-time and is not stored. This is ideal for chat responses where you want tokens to appear immediately as they're generated.

## Durable Streams

There's also persistent streaming—durable streams is what they're called. These save to a storage file that you can replay or grab later, which is really useful. You can create stored streams that persist beyond the connection for batch processing, exports, or any content that needs to be accessed after the connection closes.

## AI SDK Compatibility

Streams are compatible with the Vercel AI SDK. There are typed streams end-to-end for all types of use cases, ensuring type safety throughout your streaming implementation. This is an important and unique differentiator.
