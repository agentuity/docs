'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Message } from '../types';

const STORAGE_KEY = 'agentuity-search-history';

interface RagSearchResult {
	id: string;
	url: string;
	title: string;
	content: string;
	type: 'ai-answer' | 'document';
}

const RAG_SEARCH_ENDPOINT = '/api/rag-search';

async function queryRagSearch(query: string): Promise<RagSearchResult[]> {
	const url = new URL(RAG_SEARCH_ENDPOINT, window.location.origin);
	url.searchParams.set('query', query);

	const response = await fetch(url.toString());

	if (!response.ok) {
		const errorText = await response.text().catch(() => response.statusText);
		console.error('[rag-search] API request failed:', {
			endpoint: RAG_SEARCH_ENDPOINT,
			status: response.status,
			statusText: response.statusText,
			error: errorText,
		});
		throw new Error(`API request failed: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

export function useMessages() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				// Convert timestamp strings back to Date objects
				const messagesWithDates: Message[] = (parsed as Message[]).map(
					(msg) => ({
						...msg,
						timestamp: new Date(msg.timestamp),
					})
				);
				setMessages(messagesWithDates);
			}
		} catch (error) {
			console.warn('Failed to load chat history:', error);
		}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
		} catch (error) {
			console.warn('Failed to save chat history:', error);
		}
	}, [messages]);

	const sendMessage = useCallback(async (query: string) => {
		if (!query.trim()) return;

		const userMessage: Message = {
			id: `user-${Date.now()}`,
			type: 'user',
			content: query.trim(),
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setLoading(true);

		try {
			const results = await queryRagSearch(query.trim());

			// Find the AI answer from results
			const aiAnswerResult = results.find((r) => r.type === 'ai-answer');
			// Get document results (with properly transformed URLs)
			const documentResults = results.filter((r) => r.type === 'document');

			if (aiAnswerResult) {
				const aiMessage: Message = {
					id: `ai-${Date.now()}`,
					type: 'ai',
					content: aiAnswerResult.content,
					timestamp: new Date(),
					sources:
						documentResults.length > 0
							? documentResults.map((doc) => ({
								id: doc.id,
								title: doc.title,
								url: doc.url,
								content: doc.content,
							}))
							: undefined,
				};

				setMessages((prev) => [...prev, aiMessage]);
			} else {
				// Fallback if no answer
				const fallbackMessage: Message = {
					id: `ai-${Date.now()}`,
					type: 'ai',
					content:
						"I couldn't find a relevant answer to your question. Please try rephrasing or check our documentation directly.",
					timestamp: new Date(),
				};
				setMessages((prev) => [...prev, fallbackMessage]);
			}
		} catch (error) {
			console.error('Search error:', error);
			const errorMessage: Message = {
				id: `ai-${Date.now()}`,
				type: 'ai',
				content:
					'Sorry, I encountered an error while searching. Please try again.',
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setLoading(false);
		}
	}, []);

	const handleRetry = useCallback(() => {
		const lastUserMessage = [...messages]
			.reverse()
			.find((m) => m.type === 'user');
		if (lastUserMessage) {
			sendMessage(lastUserMessage.content);
		}
	}, [messages, sendMessage]);

	const handleClear = useCallback(() => {
		setMessages([]);
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.warn('Failed to clear chat history:', error);
		}
	}, []);

	const handleSourceClick = useCallback((url: string) => {
		if (url && url !== '#' && (url.startsWith('/') || url.startsWith('http'))) {
			window.open(url, '_blank');
		} else {
			console.warn('Invalid or potentially unsafe URL:', url);
		}
	}, []);

	return {
		messages,
		loading,
		sendMessage,
		handleRetry,
		handleClear,
		handleSourceClick,
	};
}
