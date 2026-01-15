# Key-Value Storage

This is an agent-native cloud—Agentuity is thinking about and building things for agents. Humans are here too, but it's for agents. Anything discussed—observability, sandboxes, SDK, key-value storage, vector storage—the belief is that agents should be able to access and use these appropriately.

## Redis Under the Hood

Key-value storage is Redis at the end of the day—we're all familiar with that. The SDK makes it easy to integrate with, and it's already automatically added to any of your routes and any of your agents.

## Agent Tool Usage

Your agent could use key-value storage as a tool they can reach for and say "I need to store this for something later." It's great for fast lookups, caching, rate limits, and all sorts of things Redis is good for.

## Available to Everyone

Key-value storage is available for both agents to use programmatically and for developers coding by hand.
