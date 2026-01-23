# Evaluations

When developing agents, evaluations help you ensure consistent, reliable behavior. While you're in Workbench testing things out, you might get your agent working and think "this works, now I need to make sure it consistently works over and over again, depending on the input." This is where evaluations come in.

## What Are Evaluations?

You can create evaluations—these are simple functions that actually get deployed alongside your agent code. What's cool and different from a lot of other eval systems is that most evaluation systems only assume running evals at build time, almost like a unit test.

But agents are not deterministic. Given a certain input by a user, the evaluation might go haywire. You need to know that from production—you don't want to wait.

## Production-First Evaluations

Agentuity deploys the eval alongside your agent, and then as production workloads are going through, afterwards they can run that input through your evaluation and see how it goes. This way you can know in production if certain things start failing—maybe new data was introduced, maybe a user is doing something malicious, whatever it is.

This is a cool differentiator: evals are deployed alongside for production workloads. It's not just local "data science-y" evals—this is important to understand.

## Observability Integration

All evals are attached to a production session. When you see the OpenTelemetry spans and the observability tab, the spans of each thing will say "an eval ran here" and show if it failed or passed. You can click on it to see more details. It's really nice when you're looking at your production stuff to see what's failing or not.
