'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Command } from 'cmdk';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  X,
  Send,
  RotateCcw,
  Trash2,
  User,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { AgentuityLogo } from './icons/AgentuityLogo';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: Array<{
    id: string;
    title: string;
    url: string;
    content: string;
  }>;
}

interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  type?: 'ai-answer' | 'document' | 'default';
}

const STORAGE_KEY = 'agentuity-search-history';

export default function CustomSearchDialog(props: SharedProps) {
  const { open, onOpenChange } = props;
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load messages from localStorage on mount
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

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.warn('Failed to save chat history:', error);
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Send message function
  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: query.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(currentInput);
    }
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  }, [currentInput, sendMessage, onOpenChange]);

  const handleRetry = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setCurrentInput('');
    // Also clear from localStorage
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

  if (!open) return null;

  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange} label="Search with Agentuity AI">
      <div className="fixed inset-0 z-50 bg-black/30">
        <div className="fixed left-1/2 top-1/2 w-full max-w-3xl h-[75vh] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                <AgentuityLogo className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-base font-medium text-gray-800 dark:text-gray-200">Search Documentation</h2>
                <p className="text-xs text-gray-500 dark:text-gray-500">Ask questions about Agentuity</p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ask a question</h3>
                <p className="text-xs text-gray-500 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Search our documentation or ask about Agentuity features
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'ai' && (
                  <div className="w-6 h-6 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AgentuityLogo className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                  </div>
                )}

                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-last' : ''}`}>
                  <div className={`rounded-lg px-3 py-2 ${message.type === 'user'
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 ml-auto'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}>
                    {message.type === 'ai' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-gray text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>

                  {/* Sources for AI messages */}
                  {message.type === 'ai' && message.sources && message.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Related:</p>
                      {message.sources.map((source) => (
                        <button
                          key={source.id}
                          onClick={() => handleSourceClick(source.url)}
                          className="block w-full text-left p-2 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-100 dark:border-gray-700 transition-colors"
                        >
                          <div className="font-medium text-gray-600 dark:text-gray-400 text-xs">{source.title}</div>
                          <div className="text-gray-500 dark:text-gray-500 truncate text-xs">{source.content}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mt-1.5">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <AgentuityLogo className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-500">Searching...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-50 dark:border-gray-800 p-4">
            <div className="flex gap-2 mb-3">
              <input
                ref={inputRef}
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Agentuity..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage(currentInput)}
                disabled={loading || !currentInput.trim()}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white text-sm rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-4">
                {messages.length > 0 && (
                  <>
                    <button
                      onClick={handleRetry}
                      disabled={loading}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry
                    </button>
                    <button
                      onClick={handleClear}
                      disabled={loading}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </>
                )}
              </div>
              <span className="text-gray-400 dark:text-gray-500">
                Powered by Agentuity
              </span>
            </div>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
} 