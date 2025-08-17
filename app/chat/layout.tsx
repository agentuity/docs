'use client';

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Session } from "./types";
import { sessionService } from "./services/sessionService";
import { SessionSidebar } from "./components/SessionSidebar";
import { SessionContext } from './SessionContext';
import useSWR from 'swr';



const SESSIONS_CACHE_KEY = 'agentuity-chat-sessions';

const fetcher = async (key: string): Promise<Session[]> => {
    const response = await sessionService.getAllSessions();
    if (!response.success) throw new Error(response.error || 'Failed to fetch sessions');
    return response.data || [];
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Extract sessionId from pathname
    const sessionId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : '';


    // New: Add client-side localStorage loading
    const [cachedSessions, setCachedSessions] = useState<Session[]>([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(SESSIONS_CACHE_KEY);
            if (stored) {
                setCachedSessions(JSON.parse(stored));
            }
        }
    }, []);

    // Updated useSWR with client-side fallback
    const { data: sessions = [], error, mutate, isLoading } = useSWR<Session[]>('sessions', fetcher, {
        fallbackData: cachedSessions,
        onSuccess: (data) => {
            if (typeof window !== 'undefined') {
                localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(data));
            }
        },
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        refreshInterval: 0,
    });

    // Use Next.js router for client-side navigation
    const handleSessionSelect = (id: string) => {
        router.push(`/chat/${id}`);
    };

    const handleNewSession = () => {
        router.push('/chat');
    };

    // Handle loading/error in render
    if (isLoading) return <div>Loading sessions...</div>; // Or skeleton UI
    if (error) return <div>Error: {error.message} <button onClick={() => mutate()}>Retry</button></div>;

    return (
        <div className="agentuity-background flex h-screen text-white overflow-hidden">
            <SessionSidebar
                currentSessionId={sessionId}
                sessions={sessions}
                onSessionSelect={handleSessionSelect}
                onNewSession={handleNewSession}
            />
            {/* Main Content */}
            <SessionContext.Provider value={{
                sessions,
                setSessions: (updater, options = { revalidate: true }) => {
                    let newData;
                    if (typeof updater === 'function') {
                        newData = updater(sessions);
                    } else {
                        newData = updater;
                    }
                    console.log('Mutating with new data:', newData);
                    mutate(newData, options);
                },
                currentSessionId: sessionId,
                revalidateSessions: mutate
            }}>
                <div className="flex-1 flex flex-col min-w-0">
                    {children}
                </div>
            </SessionContext.Provider>
        </div>
    );
}
