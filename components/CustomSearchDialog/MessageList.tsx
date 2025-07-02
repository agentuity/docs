'use client';

import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, HelpCircle, Loader2, Copy, Check } from 'lucide-react';
import { AgentuityLogo } from '../icons/AgentuityLogo';
import { MessageListProps, Message } from './types';

// Copy button component for code blocks
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white opacity-70 hover:opacity-100 transition-opacity"
      title="Copy code"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export function MessageList({ messages, loading, handleSourceClick }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      {messages.length === 0 && <EmptyState />}

      {messages.map((message) => (
        <MessageItem 
          key={message.id} 
          message={message} 
          handleSourceClick={handleSourceClick}
        />
      ))}

      {loading && <LoadingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
        <HelpCircle className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Ask a question
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">
        Search our documentation or ask about Agentuity features
      </p>
    </div>
  );
}

function LoadingIndicator() {
  return (
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
  );
}

interface MessageItemProps {
  message: Message;
  handleSourceClick: (url: string) => void;
}

function MessageItem({ message, handleSourceClick }: MessageItemProps) {
  return (
    <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  pre: ({ children }) => {
                    // Better text extraction for copying
                    const extractTextContent = (element: any): string => {
                      if (typeof element === 'string') return element;
                      if (typeof element === 'number') return String(element);
                      if (element?.props?.children) {
                        if (typeof element.props.children === 'string') {
                          return element.props.children;
                        }
                        if (Array.isArray(element.props.children)) {
                          return element.props.children.map(extractTextContent).join('');
                        }
                        return extractTextContent(element.props.children);
                      }
                      return '';
                    };

                    const codeText = Array.isArray(children) 
                      ? children.map(extractTextContent).join('')
                      : extractTextContent(children);

                    return (
                      <div className="relative group">
                        <pre className="max-w-full whitespace-pre-wrap break-words pr-12">
                          {children}
                        </pre>
                        <CopyButton text={codeText} />
                      </div>
                    );
                  },
                  code: ({ children, className }) => (
                    <code className={`break-words whitespace-pre-wrap ${className || ''}`}>
                      {children}
                    </code>
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
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
  );
} 