'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import type { TutorialSnippet } from '../types';

// Helper functions for markdown processing
const extractCodeFromChildren = (children: React.ReactNode) => {
    const codeElement = React.Children.toArray(children)[0] as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
    }>;
    const className = codeElement?.props?.className || '';
    const language = className.replace('language-', '');
    const code = typeof codeElement?.props?.children === 'string'
        ? codeElement.props.children
        : String(codeElement?.props?.children || '');

    return { code, language };
};

const isExecutableLanguage = (language: string) => {
    const executableExtensions = ['js', 'javascript', 'py', 'python', 'ts', 'typescript'];
    return executableExtensions.includes(language);
};

interface MarkdownRendererProps {
    content: string;
    snippets?: TutorialSnippet[];
    onOpenInEditor?: ((code: string, language: string, label?: string, identifier?: string) => void) | null;
    minimizedCodeBlocks?: Set<string>;
    toggleCodeBlockMinimized?: (identifier: string) => void;
    onRunCode?: ((code: string, language: string, blockId: string) => void) | null;
    isRunningCode?: boolean;
    codeOutput?: {
        blockId: string;
        success: boolean;
        output: string[];
        error?: string;
    } | null;
}

// Helper function to generate block ID
function hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

export function MarkdownRenderer({ content, snippets, onOpenInEditor, minimizedCodeBlocks, toggleCodeBlockMinimized, onRunCode, isRunningCode, codeOutput }: MarkdownRendererProps) {
    return (
        <div className="prose prose-sm max-w-none prose-invert text-sm text-gray-200">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    pre: ({ children }) => {
                        const { code, language } = extractCodeFromChildren(children);
                        if (isExecutableLanguage(language)) {
                            // Try to find matching snippet by content
                            const matchingSnippet = snippets?.find(s =>
                                s.content.trim() === code.trim()
                            );

                            // Extract filename from path for label
                            let label: string | undefined;
                            if (matchingSnippet?.path) {
                                const pathParts = matchingSnippet.path.split('/');
                                label = pathParts[pathParts.length - 1];
                            }

                            // Generate block ID for output matching
                            const blockId = `${language}-${hashCode(code)}`;

                            return (
                                <div>
                                    <CodeBlock
                                        content={code}
                                        language={language}
                                        label={label}
                                        identifier={matchingSnippet?.path}
                                        onOpenInEditor={onOpenInEditor}
                                        minimizedCodeBlocks={minimizedCodeBlocks}
                                        toggleCodeBlockMinimized={toggleCodeBlockMinimized}
                                        onRunCode={onRunCode ? (code, lang) => onRunCode(code, lang, blockId) : undefined}
                                        isRunning={isRunningCode}
                                    />
                                    {/* Show output if this block was executed */}
                                    {codeOutput && codeOutput.blockId === blockId && (
                                        <div className="mt-2 p-3 bg-black/20 rounded-lg border border-green-500/20">
                                            <div className="text-xs text-gray-400 mb-1 font-semibold">Output:</div>
                                            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                                                {codeOutput.output.join('\n')}
                                            </pre>
                                            {codeOutput.error && (
                                                <div className="mt-2 text-sm text-red-400">
                                                    ❌ Error: {codeOutput.error}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
                                <code className={`text-sm language-${language}`}>
                                    {code}
                                </code>
                            </pre>
                        );
                    },
                    code: ({ children, className, ...props }) => {
                        if (!className) {
                            return (
                                <code className="break-words whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                </code>
                            );
                        }
                        return <code {...props}>{children}</code>;
                    }
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
} 