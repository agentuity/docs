'use client';

import { useEffect, KeyboardEvent, useState } from 'react';
import { Send } from 'lucide-react';
import { useAutoResize } from '../utils/useAutoResize';

interface ChatInputProps {
  loading?: boolean;
  onSendMessage: (message: string) => void;
}

export function ChatInput({
  loading = false,
  onSendMessage
}: ChatInputProps) {
  const [currentInput, setCurrentInput] = useState('');
  const { textareaRef } = useAutoResize(currentInput, { maxHeight: 320 });

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!loading) {
      textareaRef.current?.focus();
    }
  }, [loading]);

  const handleSend = () => {
    if (currentInput.trim() && !loading) {
      onSendMessage(currentInput.trim());
      setCurrentInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (!e.shiftKey || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex p-2 gap-2 bg-transparent border border-white/10 rounded-xl relative z-50">
      {/* Textarea Container */}
      <div className="flex-1 min-w-0 relative">
        <div className="relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Agentuity or request tutorials..."
            className="w-full px-3 py-2 text-sm text-gray-200 placeholder-gray-400
          bg-transparent border-0 focus:outline-none agentuity-scrollbar
          min-h-[40px] max-h-[16rem] pr-10 overflow-y-auto resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Send button positioned at bottom right */}
      <button
        onClick={handleSend}
        disabled={loading || !currentInput.trim()}
        className="group h-8 w-8 agentuity-button-primary disabled:agentuity-button disabled:text-gray-300 text-white text-sm rounded-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 self-end"
        aria-label="Send message"
        type="button"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}