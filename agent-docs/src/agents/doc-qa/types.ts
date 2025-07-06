import { z } from 'zod';

export const RelevantDocSchema = z.object({
    path: z.string(),
    content: z.string(),
    relevanceScore: z.number().optional(),
    chunkRange: z.string().optional(),
    chunkIndex: z.number().optional()
});

export const AnswerSchema = z.object({
    answer: z.string(),
    documents: z.array(z.string())
});

export const PromptTypeSchema = z.enum(['Normal', 'Thinking']);

export const PromptClassificationSchema = z.object({
    type: PromptTypeSchema,
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
});

// Generated TypeScript types
export type RelevantDoc = z.infer<typeof RelevantDocSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type PromptType = z.infer<typeof PromptTypeSchema>;
export type PromptClassification = z.infer<typeof PromptClassificationSchema>;