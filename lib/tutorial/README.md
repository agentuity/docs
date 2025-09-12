# Tutorial State Management

This module provides a centralized tutorial state management system for the application.

## Architecture

- **Backend Source of Truth**: Tutorial progress is stored in KV store keyed by user ID
- **Agent Stateless**: Agent receives simple `TutorialState` (tutorialId + currentStep)
- **Frontend Hooks**: React hooks for accessing and managing tutorial state

## Key Components

### Types (`types.ts`)
- `TutorialProgress`: Individual tutorial progress with timestamps
- `UserTutorialState`: Complete user tutorial state
- `TutorialState`: Simple state for agent communication

### State Manager (`state-manager.ts`)
- `TutorialStateManager`: Core class for managing tutorial state
- KV storage operations
- Progress tracking and completion detection

### API Endpoints (`/api/users/tutorial-state`)
- `GET`: Get user's complete tutorial state
- `POST`: Update tutorial progress
- `DELETE`: Reset tutorial progress

### Frontend Hook (`/app/hooks/useTutorialState.ts`)
- `useTutorialState()`: React hook for tutorial state management
- Progress updates, completion tracking, etc.

## Usage

### Backend (Agent Communication)
```typescript
// Get current tutorial state for agent
const tutorialState = await TutorialStateManager.getCurrentTutorialState(userId);

// Send to agent
const agentPayload = {
  message: content,
  conversationHistory: history,
  tutorialData: tutorialState  // Simple: { tutorialId, currentStep }
};
```

### Frontend (React Components)
```typescript
const {
  tutorialState,
  loading,
  updateTutorialProgress,
  getTutorialProgress,
  getCompletedTutorials
} = useTutorialState();

// Check if user has completed a tutorial
const progress = getTutorialProgress('tutorial-id');
const isCompleted = progress?.completedAt != null;
```

## Data Flow

1. **User starts tutorial**: Agent creates tutorial data, backend saves progress
2. **Subsequent messages**: Backend sends current tutorial state to agent
3. **Tutorial progress**: Agent updates progress, backend persists state
4. **Frontend display**: Full tutorial data displayed, progress tracked

## Benefits

- ✅ **Persistent Progress**: Tutorial state persists across sessions
- ✅ **Clean Architecture**: Agent remains stateless and user-agnostic
- ✅ **Scalable**: Easy to add features like completion tracking, analytics
- ✅ **Type Safe**: Full TypeScript support throughout