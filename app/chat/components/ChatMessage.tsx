'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User } from 'lucide-react';
import { AgentuityLogo } from '@/components/icons/AgentuityLogo';
import { ChatMessageProps } from '../types';
import CodeBlock from './CodeBlock';
import { TutorialFileChip } from './TutorialFileChip';
import { useChatContext } from '../context/ChatContext';

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
export function ChatMessageComponent({
  message,
  onCodeExecute,
  onCodeChange,
  executionState
}: ChatMessageProps) {
  const { tutorialData, setEditorContent, setEditorOpen, editorOpen } = useChatContext();

  // Check if this message has tutorial code
  const isTutorialCode = message.codeBlock && tutorialData &&
    message.codeBlock.filename === 'index.ts' &&
    message.codeBlock.language === 'typescript';

  const handleOpenInEditor = (code: string) => {
    setEditorContent(code);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
  };

  return (
    <div className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'assistant' && (
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border border-white/30 dark:border-gray-700/30 shadow-sm">
          <AgentuityLogo className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        </div>
      )}

      <div className={`max-w-[80%] ${message.type === 'user' ? 'order-last' : ''}`}>
        <div className={`rounded-xl px-4 py-3 ${message.type === 'user'
          ? 'agentuity-button-primary text-white ml-auto'
          : 'agentuity-card text-gray-200'
          }`}>

          {message.type === 'assistant' ? (
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
                          filename={filename}
                          content={code}
                          language={language}
                          editable={true}
                          onExecute={onCodeExecute}
                          onCodeChange={(code) => onCodeChange(code, filename)}
                          executionResult={message.execution ? { ...message.execution, success: !message.execution.error } : undefined}
                          loading={executionState === 'running'}
                        />
                      );
                    }

                    // Regular code block (non-executable)
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
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {/* Render tutorial file chip or regular code block */}
        {message.codeBlock && (
          <div className="mt-3">
            {isTutorialCode ? (
              <TutorialFileChip
                codeBlock={message.codeBlock}
                onExecute={onCodeExecute}
                onCodeChange={onCodeChange}
                onOpenInEditor={handleOpenInEditor}
                onCloseEditor={handleCloseEditor}
                executionState={executionState}
                executionResult={message.execution ? { ...message.execution, success: !message.execution.error } : undefined}
                isEditorOpen={editorOpen}
              />
            ) : (
              <CodeBlock
                filename={message.codeBlock.filename}
                content={message.codeBlock.content}
                language={message.codeBlock.language}
                editable={message.codeBlock.editable}
                onExecute={onCodeExecute}
                onCodeChange={(code) => onCodeChange(code, message.codeBlock!.filename)}
                executionResult={message.execution ? { ...message.execution, success: !message.execution.error } : undefined}
                loading={executionState === 'running'}
              />
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-300 mt-2 px-2">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {message.type === 'user' && (
        <div className="w-8 h-8 bg-gradient-to-br from-gray-200/70 to-gray-300/70 dark:from-gray-600/70 dark:to-gray-700/70 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1 border border-white/30 dark:border-gray-700/30 shadow-sm">
          <User className="w-4 h-4 text-gray-300" />
        </div>
      )}
    </div>
  );
} 