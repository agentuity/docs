'use client';

import { useRef, useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { SearchInputProps } from './types';

export function SearchInput({ currentInput, setCurrentInput, loading, sendMessage }: SearchInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to scrollHeight to fit the content (up to max-height set in CSS)
    const newHeight = Math.min(textarea.scrollHeight, 150); // Max height of 150px
    textarea.style.height = `${newHeight}px`;
  }, [currentInput]);

  // Focus textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (currentInput.trim()) {
        sendMessage(currentInput);
      }
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (currentInput.trim()) {
        sendMessage(currentInput);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Agentuity..."
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all resize-none min-h-[40px] max-h-[150px] overflow-y-auto"
            disabled={loading}
            rows={1}
          />
          {currentInput.trim() && (
            <div className="absolute right-2 bottom-2 text-xs text-gray-400">
              Press Enter to send
            </div>
          )}
        </div>
        <button
          onClick={() => currentInput.trim() && sendMessage(currentInput)}
          disabled={loading || !currentInput.trim()}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white text-sm rounded-lg transition-colors disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 