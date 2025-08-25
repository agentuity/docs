'use client';

import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, HelpCircle, Loader2 } from 'lucide-react';
import { AgentuityLogo } from '../icons/AgentuityLogo';
import { CLICommand } from '../CLICommand';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import type { MessageListProps, Message } from './types';

export function MessageList({
	messages,
	loading,
	handleSourceClick,
}: MessageListProps) {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when new messages arrive
	// biome-ignore lint/correctness/useExhaustiveDependencies: Implementation specific
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	return (
		<div className="flex-1 overflow-y-auto p-5 space-y-6">
			{messages.length === 0 && <EmptyState />}

			{messages.map((message) => (
				<MessageItem
					key={message.id}
					message={message}
					handleSourceClick={handleSourceClick}
				/>
			))}

			{loading && <LoadingIndicator />}

			<div ref={messagesEndRef} />
		</div>
	);
}

function EmptyState() {
	return (
		<div className="text-center py-16">
			<div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
				<HelpCircle className="w-6 h-6 text-gray-400" />
			</div>
			<h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
				Ask a question
			</h3>
			<p className="text-xs text-gray-500 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">
				Search our documentation or ask about Agentuity features
			</p>
		</div>
	);
}

function LoadingIndicator() {
	return (
		<div className="flex gap-3">
			<div className="w-6 h-6 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
				<AgentuityLogo className="w-3 h-3 text-gray-500 dark:text-gray-400" />
			</div>
			<div className="bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2">
				<div className="flex items-center gap-2">
					<Loader2 className="w-3 h-3 animate-spin text-gray-400" />
					<span className="text-xs text-gray-500 dark:text-gray-500">
						Searching...
					</span>
				</div>
			</div>
		</div>
	);
}

interface MessageItemProps {
	message: Message;
	handleSourceClick: (url: string) => void;
}

function MessageItem({ message, handleSourceClick }: MessageItemProps) {
	return (
		<div
			className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
		>
			{message.type === 'ai' && (
				<div className="w-6 h-6 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
					<AgentuityLogo className="w-3 h-3 text-gray-500 dark:text-gray-400" />
				</div>
			)}

			<div
				className={`max-w-[85%] ${message.type === 'user' ? 'order-last' : ''}`}
			>
				<div
					className={`rounded-lg px-3 py-2 ${
						message.type === 'user'
							? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 ml-auto'
							: 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
					}`}
				>
					{message.type === 'ai' ? (
						<div className="prose prose-sm max-w-none dark:prose-invert prose-gray text-sm">
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								components={{
									pre: ({ children }) => {
										// Extract code content and language
										const codeElement = React.Children.toArray(
											children
										)[0] as React.ReactElement<{
											className?: string;
											children?: React.ReactNode;
										}>;
										const className = codeElement?.props?.className || '';
										const language = className.replace('language-', '');

										// Extract string content from children
										const code =
											typeof codeElement?.props?.children === 'string'
												? codeElement.props.children
												: String(codeElement?.props?.children || '');

										// Use CLICommand for bash/shell commands
										if (
											language === 'bash' ||
											language === 'sh' ||
											language === 'shell'
										) {
											return <CLICommand command={code} />;
										}

										return (
											<DynamicCodeBlock code={code} lang={language || 'text'} />
										);
									},
									code: ({ children, className, ...props }) => {
										if (!className) {
											return (
												<code
													className="break-words whitespace-pre-wrap"
													{...props}
												>
													{children}
												</code>
											);
										}
										return <code {...props}>{children}</code>;
									},
								}}
							>
								{message.content}
							</ReactMarkdown>
						</div>
					) : (
						<p className="text-sm whitespace-pre-wrap break-words">
							{message.content}
						</p>
					)}
				</div>

				{/* Sources for AI messages */}
				{message.type === 'ai' &&
					message.sources &&
					message.sources.length > 0 && (
						<div className="mt-2 space-y-1">
							<p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
								Related:
							</p>
							{message.sources.map((source) => (
								<button
									type="button"
									key={source.id}
									onClick={() => handleSourceClick(source.url)}
									className="block w-full text-left p-2 text-xs bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border border-gray-100 dark:border-gray-700 transition-colors"
								>
									<div className="font-medium text-gray-600 dark:text-gray-400 text-xs">
										{source.title}
									</div>
									<div className="text-gray-500 dark:text-gray-500 truncate text-xs">
										{source.content}
									</div>
								</button>
							))}
						</div>
					)}

				<div className="text-xs text-gray-400 mt-1.5">
					{message.timestamp.toLocaleTimeString([], {
						hour: '2-digit',
						minute: '2-digit',
					})}
				</div>
			</div>

			{message.type === 'user' && (
				<div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
					<User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
				</div>
			)}
		</div>
	);
}
