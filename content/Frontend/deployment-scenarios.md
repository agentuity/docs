# Deployment Scenarios

There are times when you have a Greenfield application—it's important to be able to start fresh. You can have frontend, routes, agents, all the cloud stuff, easy to deploy. But also you have existing applications.

## Existing Applications

You don't necessarily want to change your Svelte app, SvelteKit app, or Next.js app that might be deployed on Vercel or Fly or Digital Ocean or AWS or Azure or wherever. Agentuity doesn't just say "everything has to be on us."

What you can do is have just the Agentuity pieces in your project and that will still be deployed to Agentuity while all your other stuff works as-is.

## Stitching It Together

What's cool is you can build a bunch of agents in Agentuity and then stitch that together with your frontend. Your frontend knows "I can call this route in Agentuity to talk to this agent."

Agentuity handles all of that so when your thing gets deployed—say your Next.js app goes to Vercel and the Agentuity agents deploy elsewhere—it just works.
