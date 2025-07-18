# Pulse Agent

A conversational AI agent for tutorial management built with OpenAI and structured responses.

## Overview

Pulse is a friendly AI assistant that helps users discover, start, and navigate through tutorials. It uses OpenAI's GPT-4o-mini with structured response generation to provide both conversational responses and actionable instructions.

## Architecture

### Core Components

- **`index.ts`**: Main agent logic using `generateObject` for structured responses
- **`chat-helpers.ts`**: Conversation history management
- **`tutorial-helpers.ts`**: Tutorial content fetching and formatting
- **`tutorial.ts`**: Tutorial API integration

### Response Structure

The agent uses `generateObject` to return structured responses with two parts:

```typescript
{
  message: string,      // Conversational response for the user
  actionable?: {        // Optional action for the program to execute
    type: 'start_tutorial' | 'next_step' | 'previous_step' | 'get_tutorials' | 'none',
    tutorialId?: string,
    step?: number
  }
}
```

### How It Works

1. **User Input**: Agent receives user message and conversation history
2. **LLM Processing**: OpenAI generates structured response with message and optional actionable object
3. **Action Execution**: Program intercepts actionable objects and executes them:
   - `get_tutorials`: Fetches available tutorial list
   - `start_tutorial`: Fetches real tutorial content from API
   - `next_step`/`previous_step`: Navigate through tutorial steps (TODO)
4. **Response**: Returns conversational message plus any additional data (tutorial content, tutorial list, etc.)

## Key Features

- **Structured Responses**: Clean separation between conversation and actions
- **Real Tutorial Content**: No hallucinated content - all tutorial data comes from actual APIs
- **Context Awareness**: Maintains conversation history for natural references
- **Extensible Actions**: Easy to add new action types (next step, hints, etc.)
- **Debug Logging**: Comprehensive logging for troubleshooting

## Example Interactions

### Starting a Tutorial
**User**: "I want to learn the JavaScript SDK"

**LLM Response**:
```json
{
  "message": "I'd be happy to help you start the JavaScript SDK tutorial!",
  "actionable": {
    "type": "start_tutorial",
    "tutorialId": "javascript-sdk"
  }
}
```

**Final Response**:
```json
{
  "response": "I'd be happy to help you start the JavaScript SDK tutorial!",
  "tutorialData": {
    "type": "tutorial_step",
    "tutorialId": "javascript-sdk",
    "tutorialTitle": "JavaScript SDK Tutorial",
    "currentStep": 1,
    "stepContent": "Welcome to the JavaScript SDK tutorial...",
    "codeBlock": {...}
  },
  "conversationHistory": [...]
}
```

### General Conversation
**User**: "What's the difference between TypeScript and JavaScript?"

**LLM Response**:
```json
{
  "message": "TypeScript is a superset of JavaScript that adds static type checking...",
  "actionable": {
    "type": "none"
  }
}
```

## Benefits

- **Reliable**: No parsing or tool interception needed
- **Extensible**: Easy to add new action types
- **Clean**: Clear separation between conversation and actions  
- **Debuggable**: Can see exactly what the LLM wants to do
- **No Hallucination**: Tutorial content comes from real APIs, not LLM generation
