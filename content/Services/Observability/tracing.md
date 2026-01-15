# Tracing

Observability is a top-level thing in Agentuity—logging, tracing, debugging, and also analytics including web analytics. The important thing to understand about observability is it's based on OpenTelemetry, an open standard.

## Automatic Instrumentation

Agentuity handles almost all of it for you. You can customize and add your own spans and things like that, but if you're making LLM calls, API calls, whatever you're doing, Agentuity will track all of that.

## Session-Based View

You get a nice session-based view with the waterfall spans and traces. You can click into them, see how long something took, what the prompt was, what the response was, all of that.

## Integrated with Logging and Evals

Along with tracing comes logging, and of course evals are attached to it as well. When you see the spans, you can see where evals ran and whether they passed or failed.
