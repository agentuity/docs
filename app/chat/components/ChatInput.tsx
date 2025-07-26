'use client';

import { useEffect, KeyboardEvent, useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { ChatInputProps } from '../types';
import { useAutoResize } from '../hooks/useAutoResize';

export function ChatInput({ currentInput, setCurrentInput, loading, sendMessage }: ChatInputProps) {
  const { textareaRef, triggerResize } = useAutoResize(currentInput, { maxHeight: 320 });

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
    <div className="flex p-3 gap-3 bg-transparent border border-white/10 rounded-2xl relative z-50">
      {/* Textarea Container */}
      <div className="flex-1 min-w-0 relative">
        <div className="relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Agentuity or request tutorials..."
            className="w-full px-4 py-3 text-sm text-gray-200 placeholder-gray-400
              bg-transparent border-0 focus:outline-none agentuity-scrollbar
              min-h-[48px] max-h-[20rem] pr-12 overflow-y-auto resize-none"
            disabled={loading}
            rows={3}
          />
        </div>
      </div>

      {/* Send button positioned at bottom right */}
      <button
        onClick={handleSend}
        disabled={loading || !currentInput.trim()}
        className="group h-10 w-10 agentuity-button-primary disabled:agentuity-button disabled:text-gray-300 text-white text-sm rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 self-end"
        aria-label="Send message"
        type="button"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
} 