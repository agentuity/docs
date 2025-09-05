# Dynamic Island Tutorial System

A beautiful, interactive tutorial system inspired by iOS Dynamic Island that shows tutorial progress and provides contextual guidance.

## Components Overview

### 🏝️ **DynamicIsland.tsx**
**Main orchestrator component**
- Manages the overall Dynamic Island behavior
- Handles expand/collapse interactions
- Coordinates between compact and expanded views
- Integrates with tutorial state management

```typescript
<DynamicIsland
  tutorial={tutorial}
  onNextStep={handleNext}
  onPreviousStep={handlePrevious}
  onSkipStep={handleSkip}
/>
```

### 🎯 **CompactView.tsx**
**Minimized state display**
- Shows tutorial icon, title, and progress ring
- Displays current step number (e.g., "2/5")
- Beautiful circular progress indicator without text
- Clickable to expand to full view

### 📖 **ExpandedView.tsx**
**Detailed tutorial information**
- Shows full tutorial description and objective
- Displays action buttons (Previous, Next, Skip)
- Provides detailed progress indicators
- Auto-collapses after user interaction

### 🎨 **IslandWrapper.tsx**
**Visual container and animations**
- Handles smooth expand/collapse animations
- Provides glassmorphism styling
- Manages positioning and sizing
- Creates the beautiful floating effect

### 🔧 **useTutorial.ts**
**State management hook**
- Manages tutorial progress and state
- Provides navigation functions (next, previous, skip)
- Handles step completion tracking
- Persists tutorial state

```typescript
const { tutorial, nextStep, previousStep, skipStep } = useTutorial(tutorialData);
```

### 📝 **types.ts**
**Type definitions**
- `Tutorial`: Main tutorial object structure
- `TutorialStep`: Individual step configuration
- `DynamicIslandProps`: Component prop interfaces
- Ensures type safety across components

### 🛠️ **utils.ts**
**Helper functions**
- `calculateProgress()`: Computes tutorial completion percentage
- `getStepStatus()`: Determines step completion state
- `formatTime()`: Formats estimated time display
- `generateStepId()`: Creates unique step identifiers

### 📦 **index.ts**
**Export hub**
- Centralizes all component exports
- Provides clean import interface
- Exports types and utilities

## How They Work Together

```
DynamicIsland (Main)
├── IslandWrapper (Visual container)
│   ├── CompactView (Minimized state)
│   └── ExpandedView (Detailed view)
├── useTutorial (State management)
├── types (Type definitions)
└── utils (Helper functions)
```

## Integration Example

```typescript
// In your ChatInterface.tsx
import { DynamicIsland } from './components/DynamicIsland';
import { useTutorial } from './components/DynamicIsland/useTutorial';

const tutorialData = {
  id: 'getting-started',
  title: 'Getting Started',
  currentStep: 0,
  totalSteps: 5,
  steps: [/* tutorial steps */],
  isActive: true
};

const tutorialHook = useTutorial(tutorialData);

return (
  <div>
    <DynamicIsland
      tutorial={tutorialHook.tutorial}
      onNextStep={tutorialHook.nextStep}
      onPreviousStep={tutorialHook.previousStep}
      onSkipStep={tutorialHook.skipStep}
    />
    {/* Your chat interface */}
  </div>
);
```

## Key Features

- **Smooth Animations**: Seamless expand/collapse transitions
- **Progress Tracking**: Visual progress indicators and step completion
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Screen reader friendly and keyboard navigable
- **Type Safe**: Full TypeScript support
- **Modular**: Clean separation of concerns

## Styling

Uses Tailwind CSS with custom glassmorphism effects:
- `backdrop-blur-xl` for glass effect
- `bg-black/20` for translucent background
- `border-white/10` for subtle borders
- Custom animations for smooth transitions 