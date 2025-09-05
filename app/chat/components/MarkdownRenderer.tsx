'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

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

const getFilenameForLanguage = (language: string) => {
    switch (language) {
        case 'py':
        case 'python':
            return 'index.py';
        case 'ts':
        case 'typescript':
            return 'agent.ts';
        default:
            return 'index.js';
    }
};

export function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-sm max-w-none prose-invert text-sm text-gray-200">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    pre: ({ children }) => {
                        const { code, language } = extractCodeFromChildren(children);

                        if (isExecutableLanguage(language)) {
                            const filename = getFilenameForLanguage(language);

                            return (
                                <CodeBlock
                                    content={code}
                                    language={language}
                                />
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