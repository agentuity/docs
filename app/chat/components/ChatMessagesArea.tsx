'use client';

import React from 'react';
import { ChatMessageComponent } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { ChatMessage } from '../types';

interface ChatMessagesAreaProps {
    messages: ChatMessage[];
    messagesContainerRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    currentInput: string;
    setCurrentInput: (value: string) => void;
    loading: boolean;
    sendMessage: (message: string) => Promise<void>;
    executeCode: (code: string, filename: string) => Promise<void>;
    handleCodeChange: (code: string, filename: string) => void;
    executingFiles: Set<string>;
}

export function ChatMessagesArea({
    messages,
    messagesContainerRef,
    messagesEndRef,
    currentInput,
    setCurrentInput,
    loading,
    sendMessage,
    executeCode,
    handleCodeChange,
    executingFiles
}: ChatMessagesAreaProps) {
    return (
        <div className="flex-1 flex flex-col min-w-0">
            {/* Messages */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 agentuity-scrollbar"
            >
                {messages.length === 0 && (
                    <WelcomeScreen sendMessage={sendMessage} />
                )}

                {messages.map((message) => (
                    <ChatMessageComponent
                        key={message.id}
                        message={message}
                        onCodeExecute={executeCode}
                        onCodeChange={handleCodeChange}
                        executionState={message.codeBlock?.filename && executingFiles.has(message.codeBlock.filename) ? 'running' : 'idle'}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <ChatInput
                currentInput={currentInput}
                setCurrentInput={setCurrentInput}
                loading={loading}
                sendMessage={sendMessage}
            />
        </div>
    );
} 