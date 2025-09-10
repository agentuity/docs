# Streaming Protocol Design Document

## Overview

This document outlines the Server-Sent Events (SSE) protocol used for real-time communication between the Agentuity Pulse agent backend and the frontend chat interface.

## Protocol Goals

1. **Security**: Only send user-facing content, keep internal operations server-side
2. **Real-time UX**: Provide immediate feedback and progressive content loading
3. **Type Safety**: Clear message types with TypeScript interfaces
4. **Extensibility**: Easy to add new message types without breaking existing clients

## Message Format

All messages follow the SSE format:
```
data: {JSON.stringify(chunk)}\n\n
```

## Message Types

### 1. Text Content (`text-delta`)
Streams the actual AI response content progressively.

```typescript
{
  type: 'text-delta',
  textDelta: string  // Partial text content
}
```

**Frontend Handling:**
- Accumulate `textDelta` chunks to build complete response
- Update message content in real-time
- Show typing indicator when content is empty

### 2. Status Updates (`status`)
User-friendly status messages for background operations.

```typescript
{
  type: 'status',
  message: string,    // User-friendly status message
  category?: string   // Optional: 'tool', 'processing', 'search', etc.
}
```

**Frontend Handling:**
- Display as temporary status indicator
- Auto-dismiss after operation completes
- Can be shown as toast notification or inline status

### 3. Tutorial Data (`tutorial-data`)
Tutorial-specific information and code blocks.

```typescript
{
  type: 'tutorial-data',
  tutorialData: {
    tutorialId: string,
    currentStep: number,
    totalSteps: number,
    tutorialStep: {
      title: string,
      readmeContent: string,
      instructions: string,
      codeContent?: string,
      totalSteps: number
    }
  }
}
```

**Frontend Handling:**
- Update tutorial state in context
- Add code block to message if `codeContent` exists
- Auto-open editor for code blocks
- Update tutorial progress indicators

### 4. Error Messages (`error`)
Error information for failed operations.

```typescript
{
  type: 'error',
  error: string,      // User-friendly error message
  details?: string    // Optional technical details (server-side only)
}
```

**Frontend Handling:**
- Display error message to user
- Log technical details for debugging
- Provide retry options if appropriate

### 5. Stream Control (`finish`)
Indicates the stream has completed successfully.

```typescript
{
  type: 'finish'
}
```

**Frontend Handling:**
- Mark message as complete
- Update conversation history
- Clear any temporary status indicators

## Frontend Architecture

### 1. Message Processing Pipeline

```typescript
interface StreamingProcessor {
  processChunk(chunk: StreamingChunk): void;
  accumulateContent(textDelta: string): void;
  updateStatus(message: string): void;
  handleTutorialData(data: TutorialData): void;
  handleError(error: string): void;
  finalizeMessage(): void;
}
```

### 2. State Management

```typescript
interface ChatState {
  messages: ChatMessage[];
  currentMessage: ChatMessage | null;
  status: string | null;
  tutorialData: TutorialData | null;
  conversationHistory: ConversationMessage[];
}
```

### 3. Component Responsibilities

#### ChatContext
- Manages streaming connection
- Processes incoming chunks
- Updates global state
- Handles conversation history

#### ChatMessage
- Displays accumulated content
- Shows typing indicators
- Renders code blocks
- Handles tutorial-specific UI

#### StatusIndicator
- Shows temporary status messages
- Auto-dismisses after completion
- Handles different status categories

## Implementation Guidelines

### Backend Responsibilities

1. **Filter Content**: Only send user-facing data
2. **Provide Status**: Send meaningful status updates for long operations
3. **Error Handling**: Send user-friendly error messages
4. **Logging**: Log sensitive operations server-side only

### Frontend Responsibilities

1. **Chunk Processing**: Handle each message type appropriately
2. **State Updates**: Update UI progressively
3. **Error Recovery**: Handle connection issues gracefully
4. **Memory Management**: Clean up completed streams

## Example Flow

### Tutorial Start Flow
```
1. User: "Start the TypeScript tutorial"
2. Backend: status "Starting tutorial..."
3. Backend: text-delta "I'll help you get started with the TypeScript tutorial..."
4. Backend: tutorial-data { tutorialId: "ts-basics", step: 1, ... }
5. Backend: finish
```

### Documentation Search Flow
```
1. User: "How do I create an agent?"
2. Backend: status "Searching documentation..."
3. Backend: text-delta "To create an agent, you'll need to..."
4. Backend: finish
```

## Security Considerations

1. **No Internal Data**: Never stream internal reasoning, tool calls, or system prompts
2. **Sanitized Status**: Status messages should be user-friendly, not technical
3. **Error Boundaries**: Don't expose sensitive error details to frontend
4. **Rate Limiting**: Implement appropriate rate limiting for streaming endpoints

## Future Extensions

### New Message Types
- `file-upload`: Handle file upload progress
- `code-execution`: Real-time code execution results
- `collaboration`: Multi-user collaboration features

### Enhanced Status Types
- Progress bars for long operations
- Categorized status messages (tool, search, processing)
- Interactive status with user actions

## Testing Strategy

1. **Unit Tests**: Test each message type handler
2. **Integration Tests**: Test complete streaming flows
3. **Error Scenarios**: Test connection failures and error handling
4. **Performance Tests**: Test with large content streams

## Migration Path

1. **Phase 1**: Implement basic streaming with text-delta and status
2. **Phase 2**: Add tutorial-data support
3. **Phase 3**: Add error handling and finish signals
4. **Phase 4**: Add advanced status types and progress indicators 