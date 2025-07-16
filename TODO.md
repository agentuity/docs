Thoughts on next steps:
- Pulse can be an `LLM` with Tools and we can prompt it so it understands what to do.
    - Tools contain: GET /tutorials function, GET /tutorials/:tutorialId and GET /tutorials/:tutorialId
    - Code execution can be another tool so POST /execute where the body contains pure code - and tutorial/step
- The `api/execute` of the NextJS app can simply run the code directly. The body should contains
  tutorial info, execute the code based on which tutorials
- How about live feedback of the tutorial? maybe store the process ID of the run so for that session, it knows
  what is running? If it's initiating a new run, we need to stop that one run, then fire up another process.
  Consider using WebHook for real time update from the process so user can see whats displayed in the tutorial.

Output of an execution may look like this and Pulse should instruct the user to use that DevMode to interact
with the tutorial agent. Or through terminal, it can format a copy/paste code block for the user to send:
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                    │
│  ⨺ Agentuity DevMode                                                                              │
│                                                                                                    │
│  DevMode     https://app.agentuity.com/devmode/8cf56f8b6893e54e                                    │
│  Local       http://127.0.0.1:3500                                                                 │
│  Public      https://dev-f75idpyxf.agentuity.run  (only accessible while running)                  │
│                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
[DEBUG] connected to Agentuity Agent Cloud