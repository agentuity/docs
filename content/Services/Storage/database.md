# Database

The Postgres service is based on top of Neon. You can spin up Postgres databases, and it uses Bun's SQL module—so there are no extra modules or heavy binaries to import. It just works with Bun out of the box.

## Ephemeral or Persistent

Agents can treat Postgres databases as ephemeral. They can spin up a database, stuff 10,000 records in there so they can run some queries, do some things—maybe they do it in a sandbox—and then when they're done, the database could just go away. Or it could stay around forever too. It just kind of depends.

## Easy to Use

What's nice is it's easy to use from the SDK and API perspective, or even the CLI perspective for agents. This flexibility makes it very powerful for agent workflows that need temporary data processing without the overhead of managing persistent infrastructure.
