'use client';

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Session } from "./types";
import { sessionService } from "./services/sessionService";
import { SessionSidebar } from "./components/SessionSidebar";
import { SessionContext } from './SessionContext';

// Create a key for localStorage
const SESSIONS_CACHE_KEY = 'agentuity-chat-sessions';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Extract sessionId from pathname
    const sessionId = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : '';

    // Load from localStorage first if available
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const cachedSessions = localStorage.getItem(SESSIONS_CACHE_KEY);
            if (cachedSessions) {
                try {
                    setSessions(JSON.parse(cachedSessions));
                } catch (e) {
                    console.error('Failed to parse cached sessions', e);
                }
            }
        }
    }, []);

    // Fetch all sessions only once when layout mounts
    useEffect(() => {
        async function fetchSessions() {
            const response = await sessionService.getAllSessions();
            if (response.success && response.data) {
                setSessions(response.data);
                console.log('Fetched sessions', response.data);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(response.data));
                }
            }
        }

        fetchSessions();
    }, []);

    // Use Next.js router for client-side navigation
    const handleSessionSelect = (id: string) => {
        router.push(`/chat/${id}`);
    };

    const handleNewSession = () => {
        router.push('/chat');
    };

    return (
        <div className="agentuity-background flex h-screen text-white overflow-hidden">
            <div className={`fixed lg:static inset-y-0 left-0 z-50 transform transition-all duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} w-70 lg:w-70`}>
                <SessionSidebar
                    currentSessionId={sessionId}
                    sessions={sessions}
                    onSessionSelect={handleSessionSelect}
                    onNewSession={handleNewSession}
                />
            </div>
        
            {/* Main Content */}
            <SessionContext.Provider value={{ sessions, setSessions, currentSessionId: sessionId }}>
                <div className="flex-1 flex flex-col min-w-0">
                    {children}
                </div>
            </SessionContext.Provider>
        </div>
    );
}
