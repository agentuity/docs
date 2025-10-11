'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  BookAIcon,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2
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
  onNewSession,
  onDeleteSession,
  onEditSession,
  hasMore,
  onLoadMore,
  isLoadingMore
}: SessionSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSessionClick = (sessionId: string) => {
    onSessionSelect(sessionId);
  };

  const handleMenuToggle = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  const handleEditStart = (session: Session, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.sessionId);
    setEditTitle(session.title || getSessionPreview(session));
    setOpenMenuId(null);
  };

  const handleEditSave = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim() && onEditSession) {
      onEditSession(sessionId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteSession && confirm('Are you sure you want to delete this session?')) {
      onDeleteSession(sessionId);
    }
    setOpenMenuId(null);
  };

  // Get session display title
  const getSessionPreview = (session: Session) => {
    if (session.title && session.title.trim().length > 0) {
      return session.title.trim();
    }
    if (session.messages && session.messages.length > 0) {
      const firstMessage = session.messages[0];
      return firstMessage.content || 'New conversation';
    }
    return 'New conversation';
  };
  const relativeDate = formatRelativeDate(new Date());

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
        <div className="p-2 space-y-1">
          {sessions.map((session: Session) => {
            const isActive = session.sessionId === currentSessionId;
            const preview = getSessionPreview(session);
            const isTutorial = session.isTutorial;
            const isEditing = editingId === session.sessionId;
            const isMenuOpen = openMenuId === session.sessionId;

            return (
              <div
                key={session.sessionId}
                onClick={() => handleSessionClick(session.sessionId)}
                className={`
                      relative w-full flex items-center gap-2 p-2 rounded-lg text-left
                      transition-all duration-200 group cursor-pointer
                      ${isActive
                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                    : 'hover:bg-white/5 text-gray-300 hover:text-gray-200'
                  }
                      ${isCollapsed ? 'justify-center' : 'justify-start'}
                    `}
                role="button"
                aria-label={`Switch to conversation: ${preview}`}
                title={isCollapsed ? preview : undefined}
              >
                <div
                  className="flex items-center gap-2 flex-1 min-w-0"
                >
                  <div className="flex-shrink-0">
                    {isTutorial ? (
                      <BookAIcon className="w-4 h-4" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditSave(session.sessionId, e as any);
                              } else if (e.key === 'Escape') {
                                handleEditCancel(e as any);
                              }
                            }}
                            className="flex-1 bg-black/30 border border-cyan-500/30 rounded px-2 py-1 text-sm text-gray-200 focus:outline-none focus:border-cyan-500/50"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleEditSave(session.sessionId, e)}
                            className="px-2 py-1 text-xs bg-cyan-500/20 hover:bg-cyan-500/30 rounded"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium truncate">
                              {truncateText(preview, 25)}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                              {relativeDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{session.messages?.length || 0} messages</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Menu Button */}
                {!isCollapsed && !isEditing && (onDeleteSession || onEditSession) && (
                  <div className="relative flex-shrink-0" ref={isMenuOpen ? menuRef : null}>
                    <button
                      onClick={(e) => handleMenuToggle(session.sessionId, e)}
                      className="p-1 rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Session actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-8 z-50 bg-gray-900 border border-white/10 rounded-lg shadow-lg py-1 min-w-[150px]">
                        {onEditSession && (
                          <button
                            onClick={(e) => handleEditStart(session, e)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit name
                          </button>
                        )}
                        {onDeleteSession && (
                          <button
                            onClick={(e) => handleDelete(session.sessionId, e)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-white/8">
        {!isCollapsed && (
          <>
            {typeof onLoadMore === 'function' && hasMore && (
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="w-full px-2 py-1 text-sm rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-60"
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}