# Sessions & Debugging

The cloud console provides comprehensive visibility into your deployed agents and their behavior.

## Deployment

From a developer and agent perspective, deployment is easy. It's just one command: `agentuity deploy`. Or if you connected to GitHub, it's literally just merge to main and it auto-deploys for you—no need to worry about that. The CI/CD is already set up, it's seamless. Agentuity does everything for you.

Agentuity takes your code—your routes, your agents, your frontend—and wraps it in a project and container. SSL certificates, DNS routing, load balancing—all of that is managed. You don't have to do any of that. It just works.

## Cloud Console Dashboard

When it's deployed, you'll see in the dashboard your project with the active deployment. It'll show you the sessions and analytics, logs, and if your evals are failing or not. You can go into nitty-gritty details of your deployed project.

You can go into an agent and see how it's performing, how much it's costing, how many tokens it's using overall. You can click on different sessions where that agent's being used, see the logs around that specific agent, the routes that called that agent, the resources it's using like databases or key-value storage that you hooked up to it.

Remember—this is an agent-native platform, so agents should have access to these resources in order to be successful. You can look at each API route and see how it's doing.

On deployments, you can see how your deployments are doing. You can view that whole pane of glass by deployment—this deployment was just done, there was a deployment yesterday, let me compare the two. You can see the artifacts, how it's doing, the logs.

On the observability side, you get things like threads, sessions (OpenTelemetry sessions), evals, logs, and analytics—all within a project.

## CLI Integration

On most screens there's a terminal icon showing how to interact with everything on screen via the CLI. This is orthogonal—it's a cloud platform with a web app to view things, but you also have a CLI to programmatically access everything. An agent can use the CLI for debugging or setting things up programmatically, which is really useful.

You can also SSH directly into a deployed container where your agents and routes are to do things and see how it's going.

## Resource Management

There's a nice UI for managing resources like AI gateway, databases, all that stuff. You can view, search, upload things—a very nice UI for all of that.
