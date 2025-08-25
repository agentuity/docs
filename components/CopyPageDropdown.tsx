'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Copy, FileText, ChevronDown } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { OpenAIIcon } from './icons/OpenAIIcon';
import { ClaudeIcon } from './icons/ClaudeIcon';

interface PageContent {
	content: string;
	title: string;
	description: string;
	path: string;
}

type ActionType =
	| 'copy-markdown'
	| 'view-markdown'
	| 'open-chatgpt'
	| 'open-claude';

interface ActionConfig {
	id: ActionType;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	handler: () => Promise<void>;
}

interface CopyPageDropdownProps {
	enhanced?: boolean;
}

const STORAGE_KEY = 'agentuity-copy-preference';

export default function CopyPageDropdown({
	enhanced = false,
}: CopyPageDropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [preferredAction, setPreferredAction] =
		useState<ActionType>('copy-markdown');
	const [isInitialized, setIsInitialized] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (
				stored &&
				[
					'copy-markdown',
					'view-markdown',
					'open-chatgpt',
					'open-claude',
				].includes(stored)
			) {
				setPreferredAction(stored as ActionType);
			}
		} catch (error) {
			console.error('Failed to load copy preference:', error);
		} finally {
			setIsInitialized(true);
		}
	}, []);

	const savePreference = (action: ActionType) => {
		try {
			localStorage.setItem(STORAGE_KEY, action);
			setPreferredAction(action);
		} catch (error) {
			console.error('Failed to save copy preference:', error);
		}
	};

	const formatMarkdownForLLM = (content: PageContent): string => {
		return `# ${content.title}\n\n${content.description ? `${content.description}\n\n` : ''}${content.content}`;
	};

	const fetchPageContent = async (): Promise<PageContent | null> => {
		try {
			setIsLoading(true);
			const contentPath = pathname.startsWith('/')
				? pathname.slice(1)
				: pathname;

			const response = await fetch(
				`/api/page-content?path=${encodeURIComponent(contentPath)}`
			);
			if (!response.ok) throw new Error('Failed to fetch content');

			return await response.json();
		} catch (error) {
			console.error('Error fetching page content:', error);
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const handleCopyMarkdown = async () => {
		const content = await fetchPageContent();
		if (!content) return;

		const markdownForLLM = formatMarkdownForLLM(content);

		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(markdownForLLM);
			} else {
				const textArea = document.createElement('textarea');
				textArea.value = markdownForLLM;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				textArea.style.top = '-999999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				document.execCommand('copy');
				document.body.removeChild(textArea);
			}
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			const textArea = document.createElement('textarea');
			textArea.value = markdownForLLM;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			textArea.style.top = '-999999px';
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			try {
				document.execCommand('copy');
			} catch (fallbackError) {
				console.error('Fallback copy also failed:', fallbackError);
			}
			document.body.removeChild(textArea);
		}
		setIsOpen(false);
	};

	const handleViewMarkdown = async () => {
		const content = await fetchPageContent();
		if (!content) return;

		const markdownForLLM = formatMarkdownForLLM(content);
		const blob = new Blob([markdownForLLM], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);

		try {
			const newWindow = window.open(url, '_blank');
			if (!newWindow) {
				const link = document.createElement('a');
				link.href = url;
				link.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		} catch (error) {
			console.error('Failed to open markdown view:', error);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}

		setTimeout(() => URL.revokeObjectURL(url), 1000);
		setIsOpen(false);
	};

	const handleOpenInChatGPT = async () => {
		const currentUrl = `${window.location.origin}${pathname}`;
		const chatGPTUrl = `https://chatgpt.com/?hints=search&prompt=${encodeURIComponent(`Read from ${currentUrl} so I can ask questions about it`)}`;

		try {
			const newWindow = window.open(chatGPTUrl, '_blank');
			if (!newWindow) {
				window.location.href = chatGPTUrl;
			}
		} catch (error) {
			console.error('Failed to open ChatGPT:', error);
			window.location.href = chatGPTUrl;
		}
		setIsOpen(false);
	};

	const handleOpenInClaude = async () => {
		const currentUrl = `${window.location.origin}${pathname}`;
		const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(`Read from ${currentUrl} so I can ask questions about it`)}`;

		try {
			const newWindow = window.open(claudeUrl, '_blank');
			if (!newWindow) {
				window.location.href = claudeUrl;
			}
		} catch (error) {
			console.error('Failed to open Claude:', error);
			window.location.href = claudeUrl;
		}
		setIsOpen(false);
	};

	const actionConfigs: ActionConfig[] = [
		{
			id: 'copy-markdown',
			label: 'Copy as Markdown',
			icon: Copy,
			handler: handleCopyMarkdown,
		},
		{
			id: 'view-markdown',
			label: 'View as Markdown',
			icon: FileText,
			handler: handleViewMarkdown,
		},
		{
			id: 'open-chatgpt',
			label: 'Open in ChatGPT',
			icon: OpenAIIcon,
			handler: handleOpenInChatGPT,
		},
		{
			id: 'open-claude',
			label: 'Open in Claude',
			icon: ClaudeIcon,
			handler: handleOpenInClaude,
		},
	];

	const primaryAction =
		actionConfigs.find((action) => action.id === preferredAction) ||
		actionConfigs[0];

	const handlePrimaryAction = async () => {
		await primaryAction.handler();
	};

	const handleActionSelect = async (actionId: ActionType) => {
		savePreference(actionId);
		const action = actionConfigs.find((a) => a.id === actionId);
		if (action) {
			await action.handler();
		}
	};

	if (!isInitialized) {
		return null;
	}

	return (
		<Popover.Root open={isOpen} onOpenChange={setIsOpen}>
			{enhanced ? (
				<div className="inline-flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
					<button
						type="button"
						onClick={handlePrimaryAction}
						disabled={isLoading}
						aria-label={`${primaryAction.label} (primary action)`}
						className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 touch-manipulation rounded-l-md border-r border-gray-200 dark:border-gray-700"
					>
						<primaryAction.icon className="size-3.5" />
						{primaryAction.label}
					</button>
					<Popover.Trigger asChild>
						<button
							type="button"
							aria-label="More copy options"
							className="inline-flex items-center px-1.5 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 touch-manipulation rounded-r-md"
						>
							<ChevronDown className="size-3.5" />
						</button>
					</Popover.Trigger>
				</div>
			) : (
				<Popover.Trigger asChild>
					<button
						type="button"
						aria-label="Copy page options"
						className="flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 transform-origin-center border border-gray-200 dark:border-cyan-900 rounded-md size-10 hover:border-cyan-300 dark:hover:border-cyan-600"
					>
						<Copy className="size-4 text-cyan-700 dark:text-cyan-500" />
					</button>
				</Popover.Trigger>
			)}
			<Popover.Content
				className="w-64 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
				align="end"
				sideOffset={8}
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<div className="flex flex-col gap-1">
					{actionConfigs.map((action) => (
						<button
							type="button"
							key={action.id}
							onClick={() => handleActionSelect(action.id)}
							disabled={isLoading}
							className={`flex items-center gap-2 w-full px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left disabled:opacity-50 ${
								action.id === preferredAction
									? 'bg-gray-100 dark:bg-gray-700'
									: ''
							}`}
						>
							<action.icon className="size-4" />
							{action.label}
							{action.id === preferredAction && (
								<span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
									Default
								</span>
							)}
						</button>
					))}
				</div>
			</Popover.Content>
		</Popover.Root>
	);
}
