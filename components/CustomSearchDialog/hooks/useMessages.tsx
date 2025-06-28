'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, SearchResult } from '../types';

const STORAGE_KEY = 'agentuity-search-history';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const messagesWithDates: Message[] = (parsed as Message[]).map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
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

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: query.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const searchParams = new URLSearchParams({ query: query.trim() });

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`/api/search?${searchParams}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResult[] = await response.json();

      // Find AI answer and documents
      const aiAnswer = data.find(result => result.type === 'ai-answer');
      const documents = data.filter(result => result.type === 'document');

      if (aiAnswer) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: aiAnswer.content,
          timestamp: new Date(),
          sources: documents.length > 0 ? documents.map(doc => ({
            id: doc.id,
            title: doc.title,
            url: doc.url || '#',
            content: doc.content
          })) : undefined
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        // Fallback if no AI answer
        const fallbackMessage: Message = {
          id: `ai-${Date.now()}`,
          type: 'ai',
          content: 'I couldn\'t find a relevant answer to your question. Please try rephrasing or check our documentation directly.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage: Message = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: 'Sorry, I encountered an error while searching. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
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
    }
    else {
      console.warn('Invalid or potentially unsafe URL:', url);
    }
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    handleRetry,
    handleClear,
    handleSourceClick
  };
} 