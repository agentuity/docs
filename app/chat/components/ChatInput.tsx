'use client';

import { useEffect, KeyboardEvent, useState, useRef } from 'react';
import { Send, Maximize2, Minimize2, X } from 'lucide-react';
import { ChatInputProps } from '../types';
import { useAutoResize } from '../hooks/useAutoResize';

export function ChatInput({ currentInput, setCurrentInput, loading, sendMessage }: ChatInputProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { textareaRef, triggerResize } = useAutoResize(currentInput, { maxHeight: isFullscreen ? 400 : 150 });
  const prevIsFullscreen = useRef(isFullscreen);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Refocus when loading completes
  useEffect(() => {
    if (!loading) {
      textareaRef.current?.focus();
    }
  }, [loading]);

  // Focus textarea and trigger resize when exiting fullscreen mode
  useEffect(() => {
    if (prevIsFullscreen.current === true && isFullscreen === false) {
      // Small delay to ensure DOM has updated after fullscreen exit
      setTimeout(() => {
        textareaRef.current?.focus();
        triggerResize(); // Explicitly trigger resize after fullscreen exit
      }, 100);
    }
    prevIsFullscreen.current = isFullscreen;
  }, [isFullscreen, triggerResize]);

  // Handle fullscreen keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown as any);
      return () => document.removeEventListener('keydown', handleKeyDown as any);
    }
  }, [isFullscreen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (!e.shiftKey || e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (currentInput.trim()) {
        sendMessage(currentInput);
        // Exit fullscreen after sending to see the response
        if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    }
  };

  const handleSend = () => {
    if (currentInput.trim()) {
      sendMessage(currentInput);
      // Exit fullscreen after sending to see the response
      if (isFullscreen) {
        setIsFullscreen(false);
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      {/* Backdrop overlay for fullscreen mode */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      )}

      {/* Main input container */}
      <div className={`
        ${isFullscreen
          ? 'fixed inset-4 z-50 flex flex-col bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-6'
          : 'flex gap-3 items-end'
        }
      `}>

        {/* Fullscreen header */}
        {isFullscreen && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-lg font-semibold text-gray-200">Compose Message</h3>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
              aria-label="Exit fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Textarea Container */}
        <div className={`
          ${isFullscreen ? 'flex-1 flex flex-col' : 'flex-1 min-w-0 relative'}
        `}>
          <div className={`
            relative bg-transparent border border-white/10 rounded-2xl overflow-hidden
            ${isFullscreen ? 'flex-1 flex flex-col' : ''}
          `}>
            <textarea
              ref={textareaRef}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Agentuity or request code examples..."
              className={`
                w-full px-4 py-3 text-sm bg-transparent text-gray-200 placeholder-gray-400 
                transition-all resize-none focus:outline-none border-0 agentuity-scrollbar
                ${isFullscreen
                  ? 'flex-1 min-h-[200px] max-h-none pr-12 overflow-y-auto'
                  : 'min-h-[48px] max-h-[150px] pr-12 overflow-y-auto'
                }
              `}
              disabled={loading}
              rows={isFullscreen ? 10 : 1}
            />

            {/* Expand button inside textarea */}
            {!isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded transition-colors"
                aria-label="Expand to fullscreen"
                title="Expand (Ctrl+Shift+F)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className={`
          ${isFullscreen
            ? 'flex items-center justify-between pt-4 border-t border-white/10 mt-4'
            : 'flex gap-3 items-end'
          }
        `}>
          {/* Fullscreen info */}
          {isFullscreen && (
            <div className="text-xs text-gray-400">
              {currentInput.length} characters
            </div>
          )}

          {/* Send button */}
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
      </div>
    </>
  );
} 