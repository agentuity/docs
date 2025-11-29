'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Session } from '../types';

export interface ChatMessagesAreaProps {
    session: Session
    handleSendMessage: (content: string, sessionId: string) => void;
    isStreaming?: boolean;
    onStopGenerating?: () => void;
    onRetry?: () => void;
    addCodeTab?: (code: string, language: string, label?: string, identifier?: string) => void;
    minimizedCodeBlocks?: Set<string>;
    toggleCodeBlockMinimized?: (identifier: string) => void;
}

export function ChatMessagesArea({
    session,
    handleSendMessage,
    isStreaming = false,
    onStopGenerating,
    onRetry,
    addCodeTab,
    minimizedCodeBlocks,
    toggleCodeBlockMinimized
}: ChatMessagesAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Determine which message should show the retry button
    // - Last ASSISTANT message (not streaming): regenerate response
    // - Last USER message with no ASSISTANT after: agent never responded
    const getShowRetry = (index: number): boolean => {
        // Hide retry during any streaming (including before onStart callback fires)
        if (isStreaming) return false;

        const messages = session.messages;
        const message = messages[index];
        const isLastMessage = index === messages.length - 1;

        if (!isLastMessage || message.isStreaming) return false;

        if (message.author === 'ASSISTANT') {
            return true; // Last message is assistant, can retry
        }

        if (message.author === 'USER') {
            // Last message is user with no assistant response - agent never responded
            return true;
        }

        return false;
    };

    // Check if user has scrolled up
    const handleScroll = () => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setShouldAutoScroll(isAtBottom);
    };

    // Scroll to bottom when button is clicked
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShouldAutoScroll(true);
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
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
            <div
                ref={messagesContainerRef}
                className="flex-1 p-4 md:p-6 space-y-6 h-full overflow-y-auto scrollbar-thin"
                style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
            >
                {session.messages.map((message, index) => (
                    <ChatMessageComponent
                        key={message.id}
                        message={message}
                        showRetry={getShowRetry(index)}
                        onRetry={onRetry}
                        addCodeTab={addCodeTab}
                        minimizedCodeBlocks={minimizedCodeBlocks}
                        toggleCodeBlockMinimized={toggleCodeBlockMinimized}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Scroll to bottom button */}
            {!shouldAutoScroll && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-32 left-1/2 transform -translate-x-1/2 
                        text-gray-400 hover:text-white
                        transition-all duration-200 
                        z-10 p-1"
                    aria-label="Scroll to bottom"
                >
                    <ArrowDown size={20} strokeWidth={2} />
                </button>
            )}
            
            <div className="px-4 md:px-6 pb-4 md:pb-6">
                <ChatInput
                    loading={isStreaming}
                    isStreaming={isStreaming}
                    onStopGenerating={onStopGenerating}
                    onSendMessage={(content) => handleSendMessage(content, session.sessionId)}
                />
            </div>
        </div>
    );
} 