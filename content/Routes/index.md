# Routes

Routes and APIs are another core primitive alongside agents—one of the three big building blocks for building what we call agentic software. One thing constantly observed is that people want to build agents, but agents don't live in isolation. Agents have to have lots of different things, including some API or route that you call them or invoke them by.

## Built on Hono

Agentuity provides a router out of the box based on Hono—it is Hono. It uses web standards, a very typical and common way to define APIs that everybody's used to. You can create as many routes as you want or need, add schema for input and output, and use typical Hono middlewares. It's very familiar—you can look up Hono documentation and that's how it works. There's nothing hard to understand.

## Type-Safe End-to-End

Routes are type-safe end-to-end, which is pretty cool. On the frontend, there are `useAPI` hooks that are also type-safe, so you can call an API and Agentuity handles all the routing, CORS, and even authentication. That's all handled for you.

## Zero Infrastructure Setup

Just like agents have easy access to cloud services through the context, routes also have easy access to key-value storage, Redis, vector databases, streaming, sandboxes, and databases—without having to set up any cloud stuff or drive a bunch of libraries and environment variables in. It's all within reach of your Hono context.

Agentuity handles all the routing, deployment, and DNS for you. Just define your route and magically the frontend knows about it. Everything knows about it.
