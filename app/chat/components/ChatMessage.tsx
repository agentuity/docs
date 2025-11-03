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
        tutorialData?: TutorialData;
        documentationReferences?: string[];
        statusMessage?: string;
        isStreaming?: boolean;
    };
    addCodeTab?: (code: string, language: string, label?: string, identifier?: string) => void;
    minimizedCodeBlocks?: Set<string>;
    toggleCodeBlockMinimized?: (identifier: string) => void;
}
export const ChatMessageComponent = React.memo(function ChatMessageComponent({
    message,
    addCodeTab,
    minimizedCodeBlocks,
    toggleCodeBlockMinimized
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

    const handleOpenInEditor = (code: string, language: string, label?: string, identifier?: string) => {
        if (addCodeTab) {
            addCodeTab(code, language, label, identifier);
        }
    };

    const documentPathToUrl = (docPath: string): string => {
        // Remove the .md or .mdx extension before any # symbol
        const path = docPath.replace(/\.mdx?(?=#|$)/, '');

        // Split path and hash (if any)
        const [basePath, hash] = path.split('#');

        // Split the base path into segments
        const segments = basePath.split('/').filter(Boolean);

        // If the last segment is 'index', remove it
        if (segments.length > 0 && segments[segments.length - 1].toLowerCase() === 'index') {
            segments.pop();
        }

        // Reconstruct the path
        let url = '/' + segments.join('/');
        if (url === '/') {
            url = '/';
        }
        if (hash) {
            url += '#' + hash;
        }
        return url;
    };

    const handleDocumentationClick = (docPath: string) => {
        if (!docPath) return;

        const url = documentPathToUrl(docPath);
        console.log('Navigating to documentation:', docPath, '->', url);
        window.open(url, '_blank');
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
                                    <span className="text-sm tracking-wide text-gray-200">
                                        {message.statusMessage || 'Agent is processing...'}
                                    </span>
                                </div>
                            ) : (
                                <div className="relative">
                                    <MarkdownRenderer
                                        content={message.content}
                                        minimizedCodeBlocks={minimizedCodeBlocks}
                                        toggleCodeBlockMinimized={toggleCodeBlockMinimized}
                                        onOpenInEditor={handleOpenInEditor}
                                    />
                                    {message.isStreaming && (
                                        <span className="inline-block w-2 h-4 bg-cyan-400 ml-0.5 streaming-cursor" />
                                    )}
                                </div>
                            )}
                            {/* Render tutorial content if present */}
                            {tutorialMdx && memoizedTutorialContent && (
                                <div className="mt-6">
                                    {/* Subtle tutorial progress indicator */}
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 pb-2 border-b border-gray-700/30">
                                        <span className="font-mono">
                                            {message.tutorialData?.tutorialStep.title}
                                        </span>
                                        <span className="text-gray-600">•</span>
                                        <span>
                                            Step {currentStep} of {totalSteps}
                                        </span>
                                    </div>
                                    <MarkdownRenderer
                                        content={memoizedTutorialContent}
                                        snippets={tutorialSnippets}
                                        onOpenInEditor={handleOpenInEditor}
                                        minimizedCodeBlocks={minimizedCodeBlocks}
                                        toggleCodeBlockMinimized={toggleCodeBlockMinimized}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                </div>

                {/* Documentation References for ASSISTANT messages */}
                {message.author === 'ASSISTANT' && message.documentationReferences && message.documentationReferences.length > 0 && (
                    <div className="mt-3 px-2">
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-2">
                            📚 Related docs:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {message.documentationReferences.map((docPath, index) => {
                                // Extract title from path (e.g., "/docs/guide#getting-started" -> "getting-started")
                                const pathParts = docPath.split('#');
                                const basePath = pathParts[0];
                                const anchor = pathParts[1];
                                const title = anchor
                                    ? anchor.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                                    : basePath.split('/').pop() || basePath;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleDocumentationClick(docPath)}
                                        title={docPath}
                                        className="inline-flex items-center px-2.5 py-1.5 text-xs bg-gray-800/50 hover:bg-gray-700/50 dark:bg-gray-800/70 dark:hover:bg-gray-700/70 rounded-md border border-gray-700/50 dark:border-gray-600/50 transition-colors text-gray-300 hover:text-gray-200"
                                    >
                                        {title}
                                    </button>
                                );
                            })}
                        </div>
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