'use client';

import React from 'react';
import { User } from 'lucide-react';
import { AgentuityLogo } from '@/components/icons/AgentuityLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatTime } from '../utils/dateUtils';
import { TutorialFileChip } from './TutorialFileChip';
import { TutorialData } from '../types';
interface ChatMessageProps {
    message: {
        author: 'USER' | 'ASSISTANT';
        content: string;
        timestamp: string;
        tutorialData?: TutorialData
    };
    setEditorContent?: (content: string) => void;
    setEditorOpen?: (open: boolean) => void;
}

export const ChatMessageComponent = React.memo(function ChatMessageComponent({
    message,
    setEditorContent = () => { },
    setEditorOpen = () => { }
}: ChatMessageProps) {
    const tutorialContent = message.tutorialData?.tutorialStep.codeContent;
    const handleOpenInEditor = (code: string) => {
        setEditorContent(code);
        setEditorOpen(true);
    };

    return (
        <div className={`flex gap-4 ${message.author === 'USER' ? 'justify-end' : 'justify-start'}`}>
            {message.author === 'ASSISTANT' && (
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border border-white/30 dark:border-gray-700/30 shadow-sm">
                    <AgentuityLogo className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
            )}

            <div className={`max-w-[80%] ${message.author === 'USER' ? 'order-last' : ''}`}>
                <div className={`rounded-xl px-4 py-3 ${message.author === 'USER'
                    ? 'agentuity-button-primary text-white ml-auto'
                    : 'agentuity-card text-gray-200'
                    }`}>

                    {message.author === 'ASSISTANT' ? (
                        <div className="prose prose-sm max-w-none prose-invert text-sm text-gray-200">
                            {/* Enhanced typing indicator */}
                            {message.content === '' ? (
                                <div className="flex items-center gap-4 text-gray-300 mb-4">
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]"></div>
                                        <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite_0.2s]"></div>
                                        <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite_0.4s]"></div>
                                    </div>
                                    <span className="text-sm tracking-wide text-gray-200">Agent is processing...</span>
                                </div>
                            ) : (
                                <MarkdownRenderer
                                    content={message.content}
                                />
                            )}
                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                </div>

                {/* Render tutorial file chip if message has tutorial data */}
                {tutorialContent && (
                    <div className="mt-3">
                        <TutorialFileChip
                            codeBlock={{
                                filename: 'index.ts',
                                content: tutorialContent,
                                language: 'typescript'
                            }}
                            onOpenInEditor={handleOpenInEditor}
                        />
                    </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-gray-300 mt-2 px-2">
                    {formatTime(message.timestamp)}
                </div>
            </div>

            {message.author === 'USER' && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-200/70 to-gray-300/70 dark:from-gray-600/70 dark:to-gray-700/70 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border border-white/30 dark:border-gray-700/30 shadow-sm">
                    <User className="w-4 h-4 text-gray-300" />
                </div>
            )}
        </div>
    );
}); 