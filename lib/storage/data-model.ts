/**
 * Data Models for Chat System
 *
 * Defines the shape of data stored in Agentuity KV Store.
 * Optimized for KV access patterns (denormalized, minimal round trips).
 */

/**
 * KV Bucket names (namespaces)
 *
 * NOTE: Using old format for backward compatibility:
 * - Sessions and session lists both stored in 'chat-sessions' bucket
 * - Session keys use underscore format: {userId}_{sessionId}
 * - Session list keys: {userId}
 */
export const KVBuckets = {
  /** Stores individual sessions: {userId}_{sessionId} → Session */
  SESSIONS: 'chat-sessions',

  /** Stores list of session IDs per user: {userId} → string[] (same bucket as sessions) */
  SESSION_LIST: 'chat-sessions',

  /** Stores archived messages: {sessionId}_{messageId} → Message */
  MESSAGES: 'chat-messages',

  /** Stores user preferences: {userId} → UserPreferences */
  USER_PREFS: 'user-preferences',
} as const;

/**
 * Chat Session
 *
 * Stores recent messages inline (last 20) for fast access.
 * Older messages are archived separately to keep session object small.
 */
export interface Session {
  /** Unique session identifier */
  sessionId: string;

  /** User who owns this session */
  userId: string;

  /** Session title (auto-generated or user-defined) */
  title?: string;

  /** Session status */
  status: 'ACTIVE' | 'ARCHIVED';

  /** Whether this is a tutorial session */
  isTutorial?: boolean;

  /** When session was created */
  createdAt: string;

  /** When session was last updated */
  updatedAt: string;

  /** Timestamp of last message (for sorting) */
  lastMessageAt: string;

  /** Total number of messages (including archived) */
  messageCount: number;

  /** Last 20 messages stored inline for quick access */
  recentMessages: Message[];

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Chat Message
 */
export interface Message {
  /** Unique message identifier */
  id: string;

  /** Session this message belongs to */
  sessionId: string;

  /** Message author role */
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';

  /** Message content */
  content: string;

  /** When message was created */
  timestamp: string;

  /** Message processing status */
  status: 'PENDING' | 'STREAMING' | 'COMPLETED' | 'FAILED';

  /** Tutorial data if this is a tutorial response */
  tutorialData?: TutorialData;

  /** Documentation references if provided by agent */
  documentationReferences?: string[];

  /** Error message if status is FAILED */
  errorMessage?: string;

  /** Number of retry attempts */
  retryCount?: number;
}

/**
 * Tutorial data structure
 */
export interface TutorialData {
  tutorialId: string;
  currentStep: number;
  totalSteps: number;
  tutorialStep: {
    title: string;
    mdx: string;
    snippets: TutorialSnippet[];
    codeContent?: string;
    totalSteps: number;
  };
}

/**
 * Tutorial code snippet
 */
export interface TutorialSnippet {
  path: string;
  lang?: string;
  from?: number;
  to?: number;
  title?: string;
  content: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** User identifier */
  userId: string;

  /** UI theme preference */
  theme?: string;

  /** Language preference */
  language?: string;

  /** Default AI model preference */
  defaultModel?: string;

  /** When preferences were last updated */
  updatedAt: string;
}
