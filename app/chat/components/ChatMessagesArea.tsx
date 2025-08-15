'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ChatMessageComponent } from './ChatMessage';
import { WelcomeScreen } from './WelcomeScreen';
import { ChatInput } from './ChatInput';
import { sessionService } from '../services/sessionService';
import { Message, Session } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessagesAreaProps {
    session: Session
    setEditorContent?: (content: string) => void;
    setEditorOpen?: (isOpen: boolean) => void;
}

export function ChatMessagesArea({
    session,
    setEditorContent = () => { },
    setEditorOpen = () => { }
}: ChatMessagesAreaProps) {
    // State for messages and loading
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    useEffect(() => {
        if (session) {
            setMessages(session.messages);
        }
    }, [session])

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
    }, [messages, shouldAutoScroll]);

    // Add scroll listener to the messages container
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Handle sending a new message
    const handleSendMessage = async (content: string) => {
        setLoading(true);

        // Create a new message object
        const newMessage: Message = {
            id: uuidv4(),
            author: 'USER',
            content: content.trim(),
            timestamp: new Date().toISOString()
        };

        // Create assistant message placeholder
        const assistantMessage: Message = {
            id: uuidv4(),
            author: 'ASSISTANT',
            content: '', // Will be populated during streaming
            timestamp: new Date().toISOString()
        };

        try {
            // Optimistically append user message locally first
            setMessages(prevMessages => [...prevMessages, newMessage]);

            // Add assistant placeholder to show typing effect
            setMessages(prevMessages => [...prevMessages, assistantMessage]);

            // Use streaming API for real-time updates
            await sessionService.addMessageToSessionStreaming(
                session.sessionId,
                newMessage,
                {
                    onTextDelta: (textDelta) => {
                        // Update the assistant message content in real-time
                        setMessages(prev => {
                            const updatedMessages = prev.map(msg => {
                                if (msg.id === assistantMessage.id) {
                                    return {
                                        ...msg,
                                        content: msg.content + textDelta
                                    };
                                }
                                return msg;
                            });
                            return updatedMessages;
                        });
                    },

                    onTutorialData: (tutorialData) => {
                        // Update the assistant message with tutorial data
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === assistantMessage.id
                                    ? { ...msg, tutorialData: tutorialData }
                                    : msg
                            )
                        );
                    },

                    onFinish: (finalSession) => {
                        // Replace our local messages with the final session messages
                        // This ensures we have the complete and correct state from the server
                        setMessages(finalSession.messages);
                    },

                    onError: (error) => {
                        console.error('Error in streaming response:', error);
                        // Update the assistant message with error
                        setMessages(prev =>
                            prev.map(msg =>
                                msg.id === assistantMessage.id
                                    ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
                                    : msg
                            )
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Error sending message:', error);
            // Remove both messages if there was an error
            setMessages(prevMessages =>
                prevMessages.filter(msg =>
                    msg.id !== newMessage.id && msg.id !== assistantMessage.id
                )
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full">
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 agentuity-scrollbar h-full"
                style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}
            >
                {messages.map((message) => (
                    <ChatMessageComponent
                        key={message.id}
                        message={message}
                        setEditorContent={setEditorContent}
                        setEditorOpen={setEditorOpen}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <ChatInput loading={loading} onSendMessage={handleSendMessage} />
        </div>
    );
} 