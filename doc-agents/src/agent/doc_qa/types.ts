import { s } from '@agentuity/schema';

export const RelevantDocSchema = s.object({
	path: s.string(),
	content: s.string(),
	relevanceScore: s.optional(s.number()),
	chunkRange: s.optional(s.string()),
	chunkIndex: s.optional(s.number()),
});

export const AnswerSchema = s.object({
	answer: s.string(),
	documents: s.array(s.string()),
});

export const PromptTypeSchema = s.enum(['Normal', 'Thinking']);

export const PromptClassificationSchema = s.object({
	type: PromptTypeSchema,
	confidence: s.number(),
	reasoning: s.string(),
});

// Generated TypeScript types
export type RelevantDoc = {
	path: string;
	content: string;
	relevanceScore?: number;
	chunkRange?: string;
	chunkIndex?: number;
};

export type Answer = {
	answer: string;
	documents: string[];
};

export type PromptType = 'Normal' | 'Thinking';

export type PromptClassification = {
	type: PromptType;
	confidence: number;
	reasoning: string;
};
