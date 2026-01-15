# Project Structure

Agentuity provides an opinionated project structure—not super opinionated, but just opinionated enough. The goal is that any developer or agent can look at a project and immediately recognize it as an Agentuity project. You'll always know where agents live, where routes live, and where web files live.

Within that structure, you have a lot of freedom to organize your code however you prefer. But the foundational structure itself is intentional and consistent—it's not willy nilly. This predictability is a very important part of the Agentuity developer experience.

## First-Class Bun Runtime

Agentuity is built as a first-class Bun runtime. The decision to go all-in on Bun was driven by real developer needs: over and over again, developers building agents find themselves needing a frontend for an agent, an API for an agent, and even when building in Python, they often have to jump over to JavaScript for certain tasks.

Given that there are many more web developers in the ecosystem, Agentuity decided to lean all in on Bun with first-class TypeScript support. This approach enables support for really cool Bun features like Bun SQL and Bun S3 that work natively with cloud services—no extra modules or heavy binaries to import. It just works with Bun out of the box.

The configuration is easy, and it's simple to tie in Vite for frontend development. Bun is seen as the future of agent software, providing a unified runtime that handles everything from backend agent logic to frontend interfaces seamlessly.
