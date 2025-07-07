'use client';

import { useEffect, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { ChatInputProps } from '../types';
import { useAutoResize } from '../hooks/useAutoResize';

export function ChatInput({ currentInput, setCurrentInput, loading, sendMessage }: ChatInputProps) {
  const textareaRef = useAutoResize(currentInput, { maxHeight: 150 });

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Refocus when loading completes
  useEffect(() => {
    if (!loading) {
      textareaRef.current?.focus();
    }
  }, [loading]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (!e.shiftKey || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (currentInput.trim()) {
        sendMessage(currentInput);
      }
    }
  };

  const handleSend = () => {
    if (currentInput.trim()) {
      sendMessage(currentInput);
    }
  };

  return (
    <div className="flex gap-3 items-end">
      {/* Textarea Container */}
      <div className="flex-1 min-w-0 relative">
        <div className="relative bg-transparent border border-white/10 rounded-2xl overflow-hidden">
          <textarea
            ref={textareaRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Agentuity or request code examples..."
            className="w-full px-4 py-3 text-sm bg-transparent text-gray-200 placeholder-gray-400 transition-all resize-none min-h-[48px] max-h-[150px] overflow-y-auto focus:outline-none border-0"
            disabled={loading}
            rows={1}
          />
          {currentInput.trim() && !loading && (
            <div className="absolute right-3 bottom-2 text-xs text-gray-300 pointer-events-none agentuity-button px-2 py-1 rounded-lg">
              Press Enter to send
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={handleSend}
        disabled={loading || !currentInput.trim()}
                  className="group h-12 w-12 agentuity-button-primary disabled:agentuity-button disabled:text-gray-300 text-white text-sm rounded-2xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95"
        aria-label="Send message"
        type="button"
      >
        <Send className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
} 