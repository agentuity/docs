import { z } from 'zod';

export const RelevantDocSchema = z.object({
	path: z.string(),
	content: z.string(),
	relevanceScore: z.number().optional(),
	chunkRange: z.string().optional(),
	chunkIndex: z.number().optional(),
});

export const AnswerSchema = z.object({
	answer: z.string(),
	documents: z.array(z.string()),
});

// Generated TypeScript types
export type RelevantDoc = z.infer<typeof RelevantDocSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
