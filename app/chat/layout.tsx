 'use client';

 import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Session } from "./types";
import { sessionService } from "./services/sessionService";
import { SessionSidebar } from "./components/SessionSidebar";
 import { SessionSidebarSkeleton } from './components/SessionSidebarSkeleton';
import { SessionContext } from './SessionContext';
import useSWRInfinite from 'swr/infinite';



 export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const sessionId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : '';

    const getKey = (pageIndex: number, previousPageData: any) => {
        if (previousPageData && !previousPageData.pagination?.hasMore) return null;
        const cursor = previousPageData ? previousPageData.pagination.nextCursor : 0;
        return ['sessions', cursor];
    };

    const fetchPage = async ([, cursor]: [string, number]) => {
        const res = await sessionService.getSessionsPage({ cursor, limit: 10 });
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to fetch sessions');
        return res.data;
    };

    const { data, error, size, setSize, isValidating, mutate: swrMutate } = useSWRInfinite(getKey, fetchPage, {
        revalidateOnFocus: true,
        revalidateOnReconnect: true
    });

    const pages = data || [];
    // Deduplicate sessions across pages using Map to preserve order and uniqueness
    const sessionMap = new Map<string, Session>();
    pages.forEach(page => {
        page.sessions.forEach(session => {
            sessionMap.set(session.sessionId, session);
        });
    });
    const sessions: Session[] = Array.from(sessionMap.values());

    const hasMore = pages.length === 0 ? false : (pages[pages.length - 1].pagination?.hasMore ?? false);
    const isLoading = !data && !error;
    const isLoadingMore = isValidating;

    const mutate = async (newSessions: Session[], options = { revalidate: false }) => {
        // When updating sessions, we need to update all pages that might contain the session
        const updatedPages = pages.map(page => {
            const updatedPageSessions = page.sessions.map(session => {
                const updatedSession = newSessions.find(ns => ns.sessionId === session.sessionId);
                return updatedSession || session;
            });
            return { ...page, sessions: updatedPageSessions };
        });

        await swrMutate(updatedPages, options);
    };

    const handleSessionSelect = (id: string) => router.push(`/chat/${id}`);
    const handleNewSession = () => router.push('/chat');
    const loadMore = () => setSize(size + 1);

    return (
        <div className="agentuity-background flex h-screen text-white overflow-hidden">
            {/* Sidebar: show skeleton while loading, real sidebar when ready */}
            {isLoading ? (
                <SessionSidebarSkeleton />
            ) : (
                <SessionSidebar
                    currentSessionId={sessionId}
                    sessions={sessions}
                    onSessionSelect={handleSessionSelect}
                    onNewSession={handleNewSession}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    isLoadingMore={isLoadingMore}
                />
            )}
            {/* Main Content */}
            <SessionContext.Provider value={{
                sessions,
                setSessions: (updater, options = { revalidate: true }) => {
                    const newData = typeof updater === 'function' ? (updater as any)(sessions) : updater;
                    mutate(newData, options);
                },
                currentSessionId: sessionId,
                revalidateSessions: () => swrMutate(undefined, { revalidate: true })
            }}>
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Non-blocking error banner */}
                    {error && (
                        <div className="absolute top-2 right-2 z-50 bg-red-500/20 border border-red-500/40 text-red-200 text-sm px-3 py-2 rounded-md backdrop-blur">
                            <div className="flex items-center gap-3">
                                <span>Failed to load sessions</span>
                                <button
                                    onClick={() => setSize(1)}
                                    className="px-2 py-0.5 text-xs rounded bg-red-500/30 hover:bg-red-500/40 border border-red-500/50"
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}
                    {children}
                </div>
            </SessionContext.Provider>
        </div>
    );
}
