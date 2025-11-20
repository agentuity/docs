/**
 * Service Layer Factory
 *
 * Centralized initialization of services with their dependencies.
 * This ensures consistent configuration across the application.
 */

import { AgentuityKVAdapter } from '../storage/agentuity-kv-adapter';
import { sessionCache, sessionListCache } from '../cache/memory-cache';
import { SessionService } from './session-service';
import { AgentService } from './agent-service';
import { MessageService } from './message-service';

// Initialize storage adapter (singleton)
const storageAdapter = new AgentuityKVAdapter();

// Initialize SessionService (singleton)
export const sessionService = new SessionService(
  storageAdapter,
  sessionCache,
  sessionListCache
);

// Initialize AgentService (singleton)
export const agentService = new AgentService(30000); // 30 second timeout

// Initialize MessageService (singleton)
export const messageService = new MessageService(sessionService, agentService);
