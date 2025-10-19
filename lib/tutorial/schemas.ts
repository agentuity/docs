import { z } from 'zod';

// Tutorial metadata schema for frontmatter validation
export const TutorialMetadataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  totalSteps: z.number().positive('Total steps must be a positive number').optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedTime: z.string().optional()
});

// API parameter schemas
export const TutorialIdParamsSchema = z.object({
  id: z.string().min(1, 'Tutorial ID is required')
});

export const StepParamsSchema = z.object({
  id: z.string().min(1, 'Tutorial ID is required'),
  stepNumber: z.coerce.number().positive('Step number must be a positive number')
});

/**
 * Response schemas for better type safety
 * Enforces min(1) to filter out modules without interactive steps
 */
export const TutorialListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  totalSteps: z.number().int().min(1, 'Tutorial must have at least one step'),
  difficulty: z.string().optional(),
  estimatedTime: z.string().optional()
});

/**
 * Tutorial step data schema
 * Enforces 1-indexed steps (prevents step 0)
 */
export const TutorialStepDataSchema = z.object({
  stepNumber: z.number().int().min(1, 'Step number must be at least 1'),
  title: z.string(),
  estimatedTime: z.string().optional(),
  mdxContent: z.string(),
  snippets: z.array(z.object({
    path: z.string(),
    lang: z.string().optional(),
    from: z.number().optional(),
    to: z.number().optional(),
    title: z.string().optional(),
    content: z.string()
  }))
});

export const ParsedTutorialSchema = z.object({
  metadata: TutorialMetadataSchema,
  fullContent: z.string(),
  steps: z.array(TutorialStepDataSchema)
});

// Type exports for use throughout the app
export type TutorialMetadata = z.infer<typeof TutorialMetadataSchema>;
export type TutorialListItem = z.infer<typeof TutorialListItemSchema>;
export type TutorialStepData = z.infer<typeof TutorialStepDataSchema>;
export type ParsedTutorial = z.infer<typeof ParsedTutorialSchema>;
export type TutorialIdParams = z.infer<typeof TutorialIdParamsSchema>;
export type StepParams = z.infer<typeof StepParamsSchema>;
