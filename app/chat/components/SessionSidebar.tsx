'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Clock
} from 'lucide-react';
import { AgentuityLogo } from '@/components/icons/AgentuityLogo';
import { Session, SessionSidebarProps } from '../types';

// Helper function to format relative dates
const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to truncate text with ellipsis
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export function SessionSidebar({
  currentSessionId,
  sessions,
  onSessionSelect,
  onNewSession
}: SessionSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId);
  };

  // Get session preview text (first message content)
  const getSessionPreview = (session: Session) => {
    if (session.messages && session.messages.length > 0) {
      const firstMessage = session.messages[0];
      return firstMessage.content || 'New conversation';
    }
    return 'New conversation';
  };

  return (
    <div
      className={`
          fixed lg:static inset-y-0 left-0 z-50 
          transform transition-all duration-300 ease-out
          -translate-x-full lg:translate-x-0
          ${isCollapsed ? 'w-12 lg:w-12' : 'w-70 lg:w-70'}
          bg-black/20 backdrop-blur-md border-r border-white/10
          flex flex-col h-full
        `}
    >
      {/* Header Section */}
      <div className="p-3 border-b border-white/8">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20">
                <AgentuityLogo className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-gray-200 truncate">
                  Agentuity
                </h1>
                <p className="text-xs text-gray-400 truncate">
                  AI Playground
                </p>
              </div>
            </div>
          )}

          {/* Desktop Toggle Button */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Action Section */}
      <div className="p-2 border-b border-white/8">
        <button
          onClick={onNewSession}
          className={`
              w-full flex items-center gap-3 p-1 rounded-lg
              bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20
              text-cyan-400 hover:text-cyan-300 transition-all duration-200
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
          aria-label="Start new chat"
        >
          <Plus className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium">New Chat</span>
          )}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center">
            {!isCollapsed && (
              <div className="text-gray-400">
                <MessageCircle className="w-4 h-4 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No conversations yet</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sessions.map((session: Session) => {
              const isActive = session.sessionId === currentSessionId;
              const preview = getSessionPreview(session);
              // Use current timestamp since we don't have updatedAt anymore
              const relativeDate = formatRelativeDate(new Date());

              return (
                <button
                  key={session.sessionId}
                  onClick={() => handleSessionClick(session.sessionId)}
                  className={`
                      w-full flex items-center gap-2 p-2 rounded-lg text-left
                      transition-all duration-200 group
                      ${isActive
                      ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                      : 'hover:bg-white/5 text-gray-300 hover:text-gray-200'
                    }
                      ${isCollapsed ? 'justify-center' : 'justify-start'}
                    `}
                  aria-label={`Switch to conversation: ${preview}`}
                  title={isCollapsed ? preview : undefined}
                >
                  <div className="flex-shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {truncateText(preview, 25)}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {relativeDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{session.messages?.length || 0} messages</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-white/8">
      </div>
    </div>
  );
}