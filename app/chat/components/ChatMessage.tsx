'use client';

import React, { useMemo } from 'react';
import { User } from 'lucide-react';
import { AgentuityLogo } from '@/components/icons/AgentuityLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { TutorialSnippet } from '../types';
import { formatTime } from '../utils/dateUtils';
import { TutorialData } from '../types';

function transformMdxWithSnippets(mdx: string, snippets: TutorialSnippet[] = []) {
    // Replace each <CodeFromFiles .../> by consuming the appropriate number of snippets
    // based on the number of objects in its snippets={[ ... ]} prop.
    const tagRegex = /<CodeFromFiles\s+([^>]*?)\/>/g;
    let cursor = 0;
    return mdx.replace(tagRegex, (_full, propsSrc: string) => {
        const key = 'snippets={';
        const start = (propsSrc || '').indexOf(key);
        let count = start >= 0 ? 0 : 1;
        if (start >= 0) {
            // Balance braces to find the end of the snippets array
            let i = start + key.length;
            let depth = 1;
            while (i < propsSrc.length && depth > 0) {
                const ch = propsSrc[i];
                if (ch === '{') depth++;
                else if (ch === '}') depth--;
                i++;
            }
            const inner = propsSrc.slice(start + key.length, i - 1);
            // Count object literals in the array
            let j = 0;
            count = 0;
            while (j < inner.length) {
                if (inner[j] === '{') {
                    let d = 1;
                    let k = j + 1;
                    while (k < inner.length && d > 0) {
                        const ch = inner[k];
                        if (ch === '{') d++;
                        else if (ch === '}') d--;
                        k++;
                    }
                    count++;
                    j = k;
                } else {
                    j++;
                }
            }
        }

        const group = snippets.slice(cursor, cursor + count);
        const consumed = group.length;
        cursor += consumed;
        if (group.length === 0) return '';

        // Render as sequential fenced blocks for chat (no tabs in chat)
        // Move the label above the code fence to avoid injecting language-specific comment syntax
        return '\n\n' + group.map((s) => {
            const lang = s.lang || 'text';
            const label = s.title || s.path.split('/').pop() || s.path;
            return `**${label}**\n\`\`\`${lang}\n${s.content}\n\`\`\``;
        }).join('\n\n') + '\n\n';
    });
}

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

    const tutorialMdx = message.tutorialData?.tutorialStep.mdx;
    const tutorialSnippets = message.tutorialData?.tutorialStep.snippets as TutorialSnippet[] | undefined;
    const currentStep = message.tutorialData?.currentStep;
    const totalSteps = message.tutorialData?.totalSteps;

    // Memoize tutorial content transformation to avoid Rules of Hooks violation
    const memoizedTutorialContent = useMemo(() =>
        tutorialMdx ? transformMdxWithSnippets(tutorialMdx, tutorialSnippets || []) : null,
        [tutorialMdx, tutorialSnippets]
    );

    const handleOpenInEditor = (code: string, language: string) => {
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
                            {message.content === '' ? (
                                <div className="flex items-center gap-4 text-gray-300 mb-4">
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
                                        <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite_0.2s]" />
                                        <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full animate-[pulse_1.2s_ease-in-out_infinite_0.4s]" />
                                    </div>
                                    <span className="text-sm tracking-wide text-gray-200">Agent is processing...</span>
                                </div>
                            ) : (
                                <MarkdownRenderer
                                    content={message.content}
                                />
                            )}
                            {/* Render tutorial content if present */}
                            {tutorialMdx && memoizedTutorialContent && (
                                <MarkdownRenderer 
                                    content={memoizedTutorialContent} 
                                    onOpenInEditor={handleOpenInEditor} 
                                />
                            )}
                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                </div>

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