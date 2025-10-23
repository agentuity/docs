'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Session } from '../types';

export interface ChatMessagesAreaProps {
    session: Session
    handleSendMessage: (content: string, sessionId: string) => void;
    addCodeTab?: (code: string, language: string, label?: string, identifier?: string) => void;
}

export function ChatMessagesArea({
    session,
    handleSendMessage,
    addCodeTab
}: ChatMessagesAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Check if user has scrolled up
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setShouldAutoScroll(isAtBottom);
    };

    // Auto-scroll only if user is at bottom
    useEffect(() => {
        if (shouldAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [session.messages, shouldAutoScroll]);

    // Add scroll listener to the messages container
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);


    return (
        <div className="flex-1 flex flex-col min-w-0 h-full">
            <div
                ref={messagesContainerRef}
                className="flex-1 p-4 md:p-6 space-y-6 h-full overflow-y-auto scrollbar-thin"
                style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
            >
                {session.messages.map((message) => (
                    <ChatMessageComponent
                        key={message.id}
                        message={message}
                        addCodeTab={addCodeTab}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <ChatInput loading={false} onSendMessage={(content) => handleSendMessage(content, session.sessionId)} />
        </div>
    );
} 