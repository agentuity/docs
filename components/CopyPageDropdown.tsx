'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Copy, ExternalLink, FileText, MessageSquare } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

interface PageContent {
  content: string;
  title: string;
  description: string;
  path: string;
}

interface CopyPageDropdownProps {
  enhanced?: boolean;
}

export default function CopyPageDropdown({ enhanced = false }: CopyPageDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const formatMarkdownForLLM = (content: PageContent): string => {
    return `# ${content.title}\n\n${content.description ? `${content.description}\n\n` : ''}${content.content}`;
  };

  const fetchPageContent = async (): Promise<PageContent | null> => {
    try {
      setIsLoading(true);
      const contentPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      
      const response = await fetch(`/api/page-content?path=${encodeURIComponent(contentPath)}`);
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
      await navigator.clipboard.writeText(markdownForLLM);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
    setIsOpen(false);
  };

  const handleViewMarkdown = async () => {
    const content = await fetchPageContent();
    if (!content) return;
    
    const markdownForLLM = formatMarkdownForLLM(content);
    const blob = new Blob([markdownForLLM], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 100);
    setIsOpen(false);
  };

  const handleOpenInChatGPT = async () => {
    const content = await fetchPageContent();
    if (!content) return;
    
    const markdownForLLM = formatMarkdownForLLM(content);
    const chatGPTUrl = `https://chatgpt.com/?q=${encodeURIComponent(`Please help me understand this documentation:\n\n${markdownForLLM}`)}`;
    window.open(chatGPTUrl, '_blank');
    setIsOpen(false);
  };

  const handleOpenInClaude = async () => {
    const content = await fetchPageContent();
    if (!content) return;
    
    const markdownForLLM = formatMarkdownForLLM(content);
    const claudeUrl = `https://claude.ai/new?q=${encodeURIComponent(`Please help me understand this documentation:\n\n${markdownForLLM}`)}`;
    window.open(claudeUrl, '_blank');
    setIsOpen(false);
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        {enhanced ? (
          <button 
            aria-label="Copy page options"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors duration-200 shadow-sm"
          >
            <Copy className="size-4" />
            Copy page
          </button>
        ) : (
          <button 
            aria-label="Copy page options"
            className="flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 transform-origin-center border border-gray-200 dark:border-cyan-900 rounded-md size-10 hover:border-cyan-300 dark:hover:border-cyan-600"
          >
            <Copy className="size-4 text-cyan-700 dark:text-cyan-500" />
          </button>
        )}
      </Popover.Trigger>
      <Popover.Content 
        className="w-64 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col gap-1">
          <button 
            onClick={handleCopyMarkdown} 
            disabled={isLoading}
            className="flex items-center gap-2 w-full p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left disabled:opacity-50"
          >
            <Copy className="size-4" />
            Copy as Markdown for LLMs
          </button>
          <button 
            onClick={handleViewMarkdown} 
            disabled={isLoading}
            className="flex items-center gap-2 w-full p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left disabled:opacity-50"
          >
            <FileText className="size-4" />
            View as Markdown
          </button>
          <button 
            onClick={handleOpenInChatGPT} 
            disabled={isLoading}
            className="flex items-center gap-2 w-full p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left disabled:opacity-50"
          >
            <MessageSquare className="size-4" />
            Open in ChatGPT
          </button>
          <button 
            onClick={handleOpenInClaude} 
            disabled={isLoading}
            className="flex items-center gap-2 w-full p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-left disabled:opacity-50"
          >
            <ExternalLink className="size-4" />
            Open in Claude
          </button>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
