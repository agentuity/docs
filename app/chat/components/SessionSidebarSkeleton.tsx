'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function SessionSidebarSkeleton() {
  const [isCollapsed, setIsCollapsed] = useState(true);

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
      {/* Header */}
      <div className="p-3 border-b border-white/8">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="min-w-0 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(v => !v)}
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

      {/* Action */}
      <div className="p-2 border-b border-white/8">
        <button
          className={`
            w-full flex items-center gap-3 p-1 rounded-lg
            bg-white/5 border border-white/10 text-gray-300 cursor-not-allowed
            ${isCollapsed ? 'justify-center' : 'justify-start'}
          `}
          aria-label="Start new chat"
          disabled
        >
          <Plus className="w-5 h-5 flex-shrink-0 opacity-60" />
          {!isCollapsed && (
            <span className="text-sm font-medium opacity-60">New Chat</span>
          )}
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`
              w-full flex items-center gap-2 p-2 rounded-lg
              ${isCollapsed ? 'justify-center' : 'justify-start'}
            `}
          >
            <Skeleton className="w-4 h-4 rounded" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-12" />
                </div>
                <Skeleton className="h-2 w-24" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/8">
        {!isCollapsed && (
          <Skeleton className="h-7 w-full" />
        )}
      </div>
    </div>
  );
}

export default SessionSidebarSkeleton;
