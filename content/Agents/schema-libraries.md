# Schema Libraries

Agents and routes have strongly typed inputs and outputs. Agentuity uses Standard Schema for this, which means you can use any compatible schema library of your choice.

## Supported Libraries

You can use Zod, Valibot, ArkType, or other Standard Schema-compatible libraries. But Agentuity also has their own package called `@agentuity/schema`—a simple, zero-dependency, basic validation type library. You can just use this out of the box if you don't need the full power of other libraries.

Since it's Standard Schema compatible, you can use whatever you want. You have the flexibility to start with `@agentuity/schema` for simple cases and switch to more feature-rich libraries as your requirements grow.

## End-to-End Type Safety

This schema-driven approach ensures end-to-end type safety all the way to the frontend. When you define input and output schemas for your agents, those types flow through your entire application stack—from the agent handler, through API routes, to your React components or any other client.
