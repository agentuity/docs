'use client';

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Session } from "./types";
import { sessionService } from "./services/sessionService";
import { SessionSidebar } from "./components/SessionSidebar";
import { SessionContext } from './SessionContext';
import useSWRInfinite from 'swr/infinite';



export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);

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

    if (isLoading) return <div>Loading sessions...</div>;
    if (error) return <div>Error: {error.message} <button onClick={() => setSize(1)}>Retry</button></div>;

    return (
        <div className="agentuity-background flex h-screen text-white overflow-hidden">
            <SessionSidebar
                currentSessionId={sessionId}
                sessions={sessions}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
                hasMore={hasMore}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
            />
            {/* Main Content */}
            <SessionContext.Provider value={{
                sessions,
                setSessions: (updater, options = { revalidate: true }) => {
                    const newData = typeof updater === 'function' ? (updater as any)(sessions) : updater;
                    mutate(newData, options);
                },
                currentSessionId: sessionId,
                revalidateSessions: undefined
            }}>
                <div className="flex-1 flex flex-col min-w-0">
                    {children}
                </div>
            </SessionContext.Provider>
        </div>
    );
}
