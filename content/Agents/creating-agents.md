# Creating Agents

In the Agentuity SDK, agents are one of the core primitives. An agent is where you would do all of your agentic code—it's the foundational building block for your AI-powered applications.

## Framework Flexibility

Agentuity is not framework-specific. You can use any inference library or SDK you prefer—Mastra, Vercel AI SDK, the model providers' own SDKs directly, or even a coding agent SDK like Agent SDK from Claude Code. Agentuity doesn't care what you use.

What Agentuity provides is a wrapper around your inference code that makes it easy to add observability, evaluations, structured logging, authentication, and a bunch of other things—without requiring you to set up the underlying infrastructure yourself.

## Agents as Infrastructure

Agents in Agentuity are meant to be infrastructure pieces and wrappers around the inference calls you would make. The SDK provides easy access to logging, observability, OpenTelemetry traces, and cloud services without having to set up a bunch of stuff—Redis, key-value storage, databases, you name it.

Higher-level services like threads are also provided. If there's a conversation going on, Agentuity will automatically group that conversation together in a thread so the back and forth gets lumped all together. With agents, you also get observability and sessions built in. That's an important thing to understand about agents—they're the infrastructure wrapper around your inference code that makes it easy to use.

## Schema-Driven Development

When you create an agent, you're expected to have a schema—input and output—same thing with routes and APIs. This provides end-to-end type safety from the agent to the API route, all the way down to the React frontend.

This is great from a developer ergonomics perspective—you don't make mistakes and it's easy. And obviously if a coding agent is writing your stuff, it's really important too, especially when you get into coding agents like OpenCode that have LSP support.

## Agent-to-Agent Communication

Agentuity makes agent-to-agent communication easier to handle. You can invoke other agents, pass typed data between them, and build complex multi-agent workflows while maintaining type safety throughout the chain.
