# Tutorial Reader API

This module provides functionality for reading tutorial content from the filesystem and exposing it via Next.js API routes.

## Files

- `tutorial-reader.ts` - Core functions for reading individual tutorials
- `all-tutorials-reader.ts` - Functions for reading multiple tutorials
- API routes in `/app/api/tutorials/` - Next.js API endpoints

## API Endpoints

### GET `/api/tutorials`
Returns a summary of all available tutorials (from meta.json files).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "javascript-sdk-tutorial",
      "title": "Javascript SDK",
      "description": "In this tutorial, we will learn how to use Javascript SDK API to build a customer service agent.",
      "totalSteps": 1
    }
  ]
}
```

### GET `/api/tutorials/:id`
Returns full details of a specific tutorial by its meta.json ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "javascript-sdk-tutorial",
    "title": "Javascript SDK",
    "description": "...",
    "totalSteps": 1,
    "steps": [
      {
        "stepNumber": 1,
        "title": "Step 1: Handling User's Request",
        "description": "...",
        "directory": "step_1",
        "readmeContent": "...",
        "codeContent": "..."
      }
    ],
    "path": "/path/to/tutorial",
    "directoryName": "Tutorial"
  }
}
```

### GET `/api/tutorials/:id/steps/:stepNumber`
Returns details of a specific step within a tutorial.

**Response:**
```json
{
  "success": true,
  "data": {
    "stepNumber": 1,
    "title": "Step 1: Handling User's Request",
    "description": "The first thing to do is how to handle a user's request",
    "directory": "step_1",
    "readmeContent": "...",
    "codeContent": "..."
  }
}
```

## Tutorial Structure

Tutorials should be organized as follows:

```
Tutorial/
├── content/
│   ├── meta.json          # Tutorial metadata with id, title, description
│   ├── step_1/
│   │   ├── README.md      # Step documentation with front-matter
│   │   └── index.ts       # Step code
│   ├── step_2/
│   │   ├── README.md
│   │   └── index.ts
│   └── ...
```

### meta.json Format
```json
{
  "id": "unique-tutorial-id",
  "title": "Tutorial Title",
  "description": "Tutorial description"
}
```

### Step README.md Front-matter
```yaml
---
title: "Step 1: Step Title"
description: "Step description"
---

# Step content...
```

## Usage in Code

```typescript
import { readAllTutorials, readTutorialById } from '@/lib/tutorial/all-tutorials-reader';
import { readTutorial, getStepByNumber } from '@/lib/tutorial/tutorial-reader';

// Read all tutorials
const allTutorials = await readAllTutorials(basePath);

// Read specific tutorial
const tutorial = await readTutorialById(basePath, 'tutorial-id');

// Read tutorial from content path
const tutorial = await readTutorial('./Tutorial/content');

// Get specific step
const step = getStepByNumber(tutorial, 1);
``` 