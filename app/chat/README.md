# Chat Interface Architecture

This document provides an overview of the simplified chat interface architecture.

## Architecture Overview

The chat interface follows a clean and maintainable architecture with the following key components:

1. **Simple Context-based State Management**
   - `ChatContext.tsx`: Centralized state management using React Context API
   - Direct state management with useState hooks instead of complex reducers
   - Clean, straightforward API surface

2. **Service Layer**
   - `api.ts`: API service for handling all external requests
   - `storageService`: Local storage management for sessions and preferences

3. **Custom Hooks**
   - `useAutoResize.ts`: Utility for textarea auto-resizing

4. **Component Structure**
   - Smaller, focused components with clear responsibilities
   - Better separation of concerns
   - Improved type safety with TypeScript

5. **Error Handling**
   - `ErrorBoundary.tsx`: React error boundary for graceful failure handling
   - Proper error states and user feedback

## Directory Structure

```
/app/chat/
├── components/             # UI Components
│   ├── ChatInterface.tsx   # Main container component
│   ├── ChatMessage.tsx     # Message display component
│   ├── ChatInput.tsx       # User input component
│   ├── CodeBlock.tsx       # Code editor/display component
│   ├── SessionSidebar.tsx  # Session management sidebar
│   ├── TutorialNavigation.tsx # Tutorial navigation component
│   └── ErrorBoundary.tsx   # Error handling component
├── context/
│   └── ChatContext.tsx     # Simple state management
├── hooks/
│   └── useAutoResize.ts    # Textarea auto-resize hook
├── services/
│   └── api.ts              # API and storage services
├── types.ts                # TypeScript type definitions
├── [sessionId]/            # Dynamic route for sessions
│   └── page.tsx            # Session page component
└── page.tsx                # Main chat page component
```

## Agent Communication Protocol

The chat interface communicates with the Agentuity agent using a stateless protocol:

### Request Format

```typescript
{
  type: 'chat' | 'tutorial',  // Type of request
  message: string,            // User message
  sessionId: string,          // Session identifier
  conversationHistory: ConversationMessage[], // Previous messages
  tutorialData?: TutorialData // Current tutorial state (if any)
}
```

### Response Format

```typescript
{
  response: string,           // Agent's text response
  conversationHistory: ConversationMessage[], // Updated conversation history
  tutorialData?: {            // Optional tutorial data
    tutorialId: string,       // Tutorial identifier
    currentStep: number,      // Current step number
    tutorialStep: {           // Tutorial step details
      title: string,          // Step title
      content: string,        // Step content
      instructions: string,   // User instructions
      initialCode?: string,   // Code example (if any)
      totalSteps: number      // Total steps in tutorial
    }
  },
  error?: string,             // Error message (if any)
  details?: string            // Detailed error info (if any)
}
```

### Conversation History

The frontend maintains the conversation history and sends it with each request. The agent returns the updated history, which the frontend then stores for the next request.

### Tutorial State

The frontend tracks the current tutorial state (if any) and sends it with each request. The agent returns updated tutorial data when appropriate, which the frontend then displays and stores for the next request.

## Key Improvements

1. **Simplified State Management**
   - Direct useState hooks instead of complex reducer patterns
   - No action types or dispatch calls
   - Intuitive state updates

2. **Type Safety**
   - Enhanced TypeScript types with proper interfaces
   - Elimination of 'any' types
   - Strict type checking for API responses

3. **Code Organization**
   - Clean separation of concerns
   - Service layer for API calls
   - Smaller, focused components

4. **Error Handling**
   - React Error Boundary for component errors
   - Proper error states and user feedback
   - Improved error logging

5. **Accessibility**
   - ARIA attributes for better screen reader support
   - Keyboard navigation support
   - Proper focus management

## Usage

To use the chat interface, simply import the ChatProvider and wrap your component:

```tsx
import { ChatProvider } from './context/ChatContext';
import { ChatInterface } from './components/ChatInterface';

export default function ChatPage({ params }) {
  const sessionId = params.sessionId || 'default-session';
  
  return (
    <ChatProvider initialSessionId={sessionId}>
      <ChatInterface sessionId={sessionId} />
    </ChatProvider>
  );
}
``` 