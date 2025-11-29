/**
 * Session Service
 *
 * Business logic for managing chat sessions.
 * Handles session creation, retrieval, updates, and deletion.
 */

import { randomUUID } from 'crypto';
import type { IStorageAdapter } from '../storage/types';
import type { Session, Message } from '../storage/data-model';
import { KVBuckets } from '../storage/data-model';
import type { MemoryCache } from '../cache/memory-cache';

export interface CreateSessionInput {
  userId: string;
  title?: string;
  isTutorial?: boolean;
  metadata?: Record<string, any>;
}

export interface CreateSessionWithIdInput extends CreateSessionInput {
  sessionId: string; // Client-provided sessionId
}

export interface UpdateSessionInput {
  title?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  isTutorial?: boolean;
  metadata?: Record<string, any>;
}

export interface ListSessionsOptions {
  limit?: number;
  offset?: number;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface ListSessionsResult {
  sessions: Session[];
  total: number;
  hasMore: boolean;
}

export class SessionService {
  constructor(
    private storage: IStorageAdapter,
    private cache: MemoryCache<Session>,
    private listCache: MemoryCache<string[]>
  ) {}

  /**
   * Create a new session
   */
  async createSession(input: CreateSessionInput): Promise<Session> {
    const now = new Date().toISOString();
    const sessionId = randomUUID();

    const session: Session = {
      sessionId,
      userId: input.userId,
      title: input.title,
      status: 'ACTIVE',
      isTutorial: input.isTutorial ?? false,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      messageCount: 0,
      recentMessages: [],
      metadata: input.metadata,
    };

    // Store session in KV (using underscore format for backward compatibility)
    const sessionKey = `${input.userId}_${sessionId}`;
    await this.storage.set(KVBuckets.SESSIONS, sessionKey, session);

    // Add to session list
    await this.addToSessionList(input.userId, sessionKey);

    // Cache the session
    this.cache.set(`session:${sessionKey}`, session);

    // Invalidate list cache for this user
    this.listCache.delete(`list:${input.userId}`);

    return session;
  }

  /**
   * Create a new session with client-provided sessionId
   * Used when frontend has already generated the sessionId
   */
  async createSessionWithId(input: CreateSessionWithIdInput): Promise<Session> {
    const now = new Date().toISOString();

    const session: Session = {
      sessionId: input.sessionId, // Use client's sessionId
      userId: input.userId,
      title: input.title,
      status: 'ACTIVE',
      isTutorial: input.isTutorial ?? false,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      messageCount: 0,
      recentMessages: [],
      metadata: input.metadata,
    };

    // Store session in KV (using underscore format for backward compatibility)
    const sessionKey = `${input.userId}_${input.sessionId}`;
    await this.storage.set(KVBuckets.SESSIONS, sessionKey, session);

    // Add to session list
    await this.addToSessionList(input.userId, sessionKey);

    // Cache the session
    this.cache.set(`session:${sessionKey}`, session);

    // Invalidate list cache for this user
    this.listCache.delete(`list:${input.userId}`);

    return session;
  }

  /**
   * Get a session by ID
   */
  async getSession(userId: string, sessionId: string): Promise<Session | null> {
    const sessionKey = `${userId}_${sessionId}`;
    const cacheKey = `session:${sessionKey}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from storage
    const result = await this.storage.get<Session>(KVBuckets.SESSIONS, sessionKey);

    if (!result.exists || !result.data) {
      return null;
    }

    // Cache it
    this.cache.set(cacheKey, result.data);

    return result.data;
  }

  /**
   * List sessions for a user
   */
  async listSessions(
    userId: string,
    options: ListSessionsOptions = {}
  ): Promise<ListSessionsResult> {
    const { limit = 20, offset = 0, status } = options;

    // Get session list (from cache or storage)
    const sessionKeys = await this.getSessionList(userId);

    // Filter by status if specified
    let filteredSessions: Session[] = [];

    for (const key of sessionKeys) {
      const session = await this.getSessionByKey(key);
      if (session && (!status || session.status === status)) {
        filteredSessions.push(session);
      }
    }

    // Sort by lastMessageAt (most recent first)
    filteredSessions.sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );

    // Paginate
    const total = filteredSessions.length;
    const paginatedSessions = filteredSessions.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      sessions: paginatedSessions,
      total,
      hasMore,
    };
  }

  /**
   * Update a session
   */
  async updateSession(
    userId: string,
    sessionId: string,
    input: UpdateSessionInput
  ): Promise<Session | null> {
    const sessionKey = `${userId}_${sessionId}`;
    const session = await this.getSession(userId, sessionId);

    if (!session) {
      return null;
    }

    // Update fields
    const updatedSession: Session = {
      ...session,
      title: input.title ?? session.title,
      status: input.status ?? session.status,
      isTutorial: input.isTutorial ?? session.isTutorial,
      metadata: input.metadata ? { ...session.metadata, ...input.metadata } : session.metadata,
      updatedAt: new Date().toISOString(),
    };

    // Save to storage
    await this.storage.set(KVBuckets.SESSIONS, sessionKey, updatedSession);

    // Update cache
    this.cache.set(`session:${sessionKey}`, updatedSession);

    // Invalidate list cache
    this.listCache.delete(`list:${userId}`);

    return updatedSession;
  }

  /**
   * Delete a session
   */
  async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    const sessionKey = `${userId}_${sessionId}`;

    // Remove from storage
    await this.storage.delete(KVBuckets.SESSIONS, sessionKey);

    // Remove from session list
    await this.removeFromSessionList(userId, sessionKey);

    // Remove from cache
    this.cache.delete(`session:${sessionKey}`);

    // Invalidate list cache
    this.listCache.delete(`list:${userId}`);

    return true;
  }

  /**
   * Remove the last assistant message from a session
   * Used for retry/regenerate functionality
   */
  async removeLastAssistantMessage(
    userId: string,
    sessionId: string
  ): Promise<boolean> {
    const session = await this.getSession(userId, sessionId);

    if (!session) {
      return false;
    }

    // Find the last assistant message index
    const lastAssistantIdx = session.recentMessages.reduceRight(
      (found, msg, idx) => (found === -1 && msg.role === 'ASSISTANT' ? idx : found),
      -1
    );

    if (lastAssistantIdx === -1) {
      return false; // No assistant message to remove
    }

    // Remove the message
    session.recentMessages.splice(lastAssistantIdx, 1);
    session.messageCount = Math.max(0, session.messageCount - 1);
    session.updatedAt = new Date().toISOString();

    // Save to storage
    const sessionKey = `${userId}_${sessionId}`;
    await this.storage.set(KVBuckets.SESSIONS, sessionKey, session);

    // Update cache
    this.cache.set(`session:${sessionKey}`, session);

    // Invalidate list cache
    this.listCache.delete(`list:${userId}`);

    return true;
  }

  /**
   * Add a message to session's recent messages
   * This is called by MessageService when a new message is created
   */
  async addMessageToSession(
    userId: string,
    sessionId: string,
    message: Message
  ): Promise<void> {
    const session = await this.getSession(userId, sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add message to recent messages
    session.recentMessages.push(message);

    // Keep only last 20 messages inline
    if (session.recentMessages.length > 20) {
      session.recentMessages = session.recentMessages.slice(-20);
    }

    // Update metadata
    session.messageCount++;
    session.lastMessageAt = message.timestamp;
    session.updatedAt = new Date().toISOString();

    // Save to storage
    const sessionKey = `${userId}_${sessionId}`;
    await this.storage.set(KVBuckets.SESSIONS, sessionKey, session);

    // Update cache
    this.cache.set(`session:${sessionKey}`, session);

    // Invalidate list cache (for sorting by lastMessageAt)
    this.listCache.delete(`list:${userId}`);
  }

  /**
   * Helper: Get session list for a user
   */
  private async getSessionList(userId: string): Promise<string[]> {
    const cacheKey = `list:${userId}`;

    // Check cache
    const cached = this.listCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from storage
    const result = await this.storage.get<string[]>(KVBuckets.SESSION_LIST, userId);

    const sessionKeys = result.exists && result.data ? result.data : [];

    // Cache it
    this.listCache.set(cacheKey, sessionKeys);

    return sessionKeys;
  }

  /**
   * Helper: Get session by storage key
   */
  private async getSessionByKey(key: string): Promise<Session | null> {
    const cacheKey = `session:${key}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from storage
    const result = await this.storage.get<Session>(KVBuckets.SESSIONS, key);

    if (!result.exists || !result.data) {
      return null;
    }

    // Cache it
    this.cache.set(cacheKey, result.data);

    return result.data;
  }

  /**
   * Helper: Add session to user's session list
   */
  private async addToSessionList(userId: string, sessionKey: string): Promise<void> {
    const sessionKeys = await this.getSessionList(userId);

    // Add if not already present
    if (!sessionKeys.includes(sessionKey)) {
      sessionKeys.push(sessionKey);
      await this.storage.set(KVBuckets.SESSION_LIST, userId, sessionKeys);
    }

    // Invalidate cache
    this.listCache.delete(`list:${userId}`);
  }

  /**
   * Helper: Remove session from user's session list
   */
  private async removeFromSessionList(userId: string, sessionKey: string): Promise<void> {
    const sessionKeys = await this.getSessionList(userId);

    const filtered = sessionKeys.filter(key => key !== sessionKey);

    await this.storage.set(KVBuckets.SESSION_LIST, userId, filtered);

    // Invalidate cache
    this.listCache.delete(`list:${userId}`);
  }
}
