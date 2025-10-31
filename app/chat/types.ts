import { z } from 'zod';

export const TutorialSnippetSchema = z.object({
  path: z.string(),
  lang: z.string().optional(),
  from: z.number().int().optional(),
  to: z.number().int().optional(),
  title: z.string().optional(),
  content: z.string()
});

export type TutorialSnippet = z.infer<typeof TutorialSnippetSchema>;

/**
 * Tutorial data schema for agent responses
 * - Steps are 1-indexed (no step 0 concept)
 * - Only tutorials with interactive steps are tracked
 */
export const TutorialDataSchema = z.object({
  tutorialId: z.string(),
  totalSteps: z.number().int().min(1),
  currentStep: z.number().int().min(1),
  tutorialStep: z.object({
    title: z.string(),
    mdx: z.string(),
    snippets: z.array(TutorialSnippetSchema),
    codeContent: z.string().optional(),
    totalSteps: z.number().int().min(1)
  })
});

export type TutorialData = z.infer<typeof TutorialDataSchema>;

export const MessageSchema = z.object({
  id: z.string().min(1),
  author: z.enum(['USER', 'ASSISTANT']),
  content: z.string(),
  timestamp: z.string(),
  tutorialData: TutorialDataSchema.optional(),
  documentationReferences: z.array(z.string()).optional(),
  statusMessage: z.string().optional(),
  isStreaming: z.boolean().optional()
});

export type Message = z.infer<typeof MessageSchema>;

export const CodeFileSchema = z.object({
  filename: z.string(),
  content: z.string(),
  language: z.string()
});

export type CodeFile = z.infer<typeof CodeFileSchema>;

export const SessionSchema = z.object({
  messages: z.array(MessageSchema),
  sessionId: z.string().min(1),
  isTutorial: z.boolean().optional(),
  title: z.string().optional()
});

export type Session = z.infer<typeof SessionSchema>;

export interface SessionSidebarProps {
  currentSessionId: string;
  sessions: Session[];
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onEditSession?: (sessionId: string, newTitle: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export const ExecuteRequestSchema = z.object({
  code: z.string().min(1),
  filename: z.string().min(1),
  sessionId: z.string().min(1)
});

export type ExecuteRequest = z.infer<typeof ExecuteRequestSchema>;

export const StreamingChunkSchema = z.object({
  type: z.enum(['text-delta', 'status', 'tutorial-data', 'documentation-references', 'error', 'finish']),
  textDelta: z.string().optional(),
  message: z.string().optional(),
  category: z.string().optional(),
  tutorialData: TutorialDataSchema.optional(),
  documents: z.array(z.string()).optional(),
  error: z.string().optional(),
  details: z.string().optional()
});

export type StreamingChunk = z.infer<typeof StreamingChunkSchema>;

// // Agent request type
// export interface AgentStreamingRequest {
//   message: string;
//   conversationHistory: Message[];
//   tutorialData?: TutorialData;
// }

// export interface ChatMessageProps {
//   message: Message;
//   onCodeExecute: (code: string, filename: string) => Promise<void>;
//   onCodeChange: (code: string, filename: string) => void;
//   executionState: ExecutionState;
// }

// export type ExecutionState = 'idle' | 'running' | 'completed' | 'error';

