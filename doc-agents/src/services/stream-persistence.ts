/**
 * Stream Persistence Service
 *
 * Wraps an SSE stream to accumulate content and persist to session storage.
 * Lives in services layer - called by API routes, not agents.
 *
 * Design: Instead of modifying the 'finish' event, we append a separate
 * 'session-saved' event after the stream ends. This avoids complex
 * stream interception and keeps the code simple.
 */

// Types
export interface Message {
	id: string;
	author: 'USER' | 'ASSISTANT';
	content: string;
	timestamp: string;
	tutorialData?: TutorialData;
}

export interface Session {
	sessionId: string;
	messages: Message[];
	title?: string;
}

export interface TutorialData {
	tutorialId: string;
	currentStep: number;
	totalSteps?: number;
}

interface KVStore {
	get<T>(storeName: string, key: string): Promise<{ exists: boolean; data?: T }>;
	set(storeName: string, key: string, value: unknown): Promise<void>;
}

interface Logger {
	info(msg: string, ...args: unknown[]): void;
	error(msg: string, ...args: unknown[]): void;
	warn(msg: string, ...args: unknown[]): void;
}

export interface PersistenceConfig {
	kv: KVStore;
	userId: string;
	sessionId: string;
	kvStoreName: string;
	logger: Logger;
	onTutorialProgress?: (data: TutorialData) => Promise<void>;
	onSessionSaved?: (session: Session) => void;
}

/**
 * Wraps an agent SSE stream with persistence logic.
 *
 * - Forwards all chunks immediately (zero latency added)
 * - Accumulates text-delta content in background
 * - After stream ends: saves to KV, emits 'session-saved' event
 */
export function withPersistence(
	stream: ReadableStream<Uint8Array>,
	config: PersistenceConfig
): ReadableStream<Uint8Array> {
	const { kv, userId, sessionId, kvStoreName, logger, onTutorialProgress, onSessionSaved } = config;
	const sessionKey = `${userId}_${sessionId}`;

	let accumulated = '';
	let capturedTutorialData: TutorialData | null = null;

	const decoder = new TextDecoder();
	const encoder = new TextEncoder();

	return new ReadableStream<Uint8Array>({
		async start(controller) {
			const reader = stream.getReader();

			try {
				// Phase 1: Forward all chunks, accumulate content
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					// Forward immediately (zero latency added)
					controller.enqueue(value);

					// Accumulate in background
					const text = decoder.decode(value, { stream: true });
					accumulated += extractTextDeltas(text);

					const tutorial = extractTutorialData(text);
					if (tutorial) {
						capturedTutorialData = tutorial;
						if (onTutorialProgress) {
							try {
								await onTutorialProgress(tutorial);
							} catch (e) {
								logger.warn('onTutorialProgress callback failed: %s', e instanceof Error ? e.message : String(e));
							}
						}
					}
				}

				// Phase 2: Stream ended - save to KV
				const session = await saveAssistantMessage(
					kv,
					kvStoreName,
					sessionKey,
					accumulated,
					capturedTutorialData,
					logger
				);

				if (session) {
					await updateMRU(kv, kvStoreName, userId, sessionKey, logger);

					if (onSessionSaved) {
						onSessionSaved(session);
					}

					// Emit session-saved event (with leading newline to ensure separation)
					controller.enqueue(
						encoder.encode(`\ndata: ${JSON.stringify({ type: 'session-saved', session })}\n\n`)
					);
				}
			} catch (error) {
				logger.error(
					'Stream persistence error: %s',
					error instanceof Error ? error.message : String(error)
				);
				controller.enqueue(
					encoder.encode(
						`data: ${JSON.stringify({ type: 'error', error: 'Failed to save session' })}\n\n`
					)
				);
			} finally {
				controller.close();
			}
		},
	});
}

/**
 * Extract text content from text-delta events.
 * Uses regex to avoid full JSON parsing for performance.
 */
function extractTextDeltas(text: string): string {
	let result = '';
	const regex = /"type":"text-delta","textDelta":"((?:[^"\\]|\\.)*)"/g;
	let match;
	while ((match = regex.exec(text)) !== null) {
		try {
			// Unescape JSON string (handles \n, \t, unicode, etc.)
			result += JSON.parse(`"${match[1]}"`);
		} catch {
			// If parse fails, use raw match
			result += match[1];
		}
	}
	return result;
}

/**
 * Extract tutorial data from tutorial-data events.
 */
function extractTutorialData(text: string): TutorialData | null {
	const match = text.match(/"type":"tutorial-data","tutorialData":(\{[^}]+\})/);
	if (match && match[1]) {
		try {
			return JSON.parse(match[1]) as TutorialData;
		} catch {
			return null;
		}
	}
	return null;
}

/**
 * Save assistant message to session in KV.
 */
async function saveAssistantMessage(
	kv: KVStore,
	storeName: string,
	sessionKey: string,
	content: string,
	tutorialData: TutorialData | null,
	logger: Logger
): Promise<Session | null> {
	try {
		const result = await kv.get<Session>(storeName, sessionKey);
		if (!result.exists || !result.data) {
			logger.warn('Session not found for key: %s', sessionKey);
			return null;
		}

		const session = result.data;

		// Create assistant message
		const assistantMessage: Message = {
			id: crypto.randomUUID(),
			author: 'ASSISTANT',
			content,
			timestamp: new Date().toISOString(),
			...(tutorialData && { tutorialData }),
		};

		// Add message to session
		session.messages.push(assistantMessage);

		// Save session
		await kv.set(storeName, sessionKey, session);
		logger.info('Saved assistant message to session: %s', sessionKey);

		return session;
	} catch (error) {
		logger.error(
			'Failed to save assistant message: %s',
			error instanceof Error ? error.message : String(error)
		);
		return null;
	}
}

/**
 * Update Most Recently Used list for user's sessions.
 */
async function updateMRU(
	kv: KVStore,
	storeName: string,
	userId: string,
	sessionKey: string,
	logger: Logger
): Promise<void> {
	try {
		const mruResult = await kv.get<string[]>(storeName, userId);
		const mruList = mruResult.exists && mruResult.data ? mruResult.data : [];

		// Remove if exists, add to front
		const filtered = mruList.filter((k) => k !== sessionKey);
		filtered.unshift(sessionKey);

		await kv.set(storeName, userId, filtered);
	} catch (error) {
		logger.error('Failed to update MRU: %s', error instanceof Error ? error.message : String(error));
	}
}
