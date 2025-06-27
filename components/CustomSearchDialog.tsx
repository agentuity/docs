'use client';

import { useState, useCallback } from 'react';
import { Command } from 'cmdk';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SharedProps } from 'fumadocs-ui/components/dialog/search';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  type?: 'ai-answer' | 'document' | 'default';
}

export default function CustomSearchDialog(props: SharedProps) {
  const { open, onOpenChange } = props;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Perform search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchParams = new URLSearchParams({ query: searchQuery });
    
    try {
      const response = await fetch(`/api/search?${searchParams}`);
      const data: SearchResult[] = await response.json();
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch(query);
    }
  }, [query, performSearch]);

  // Handle clicking on document results
  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.type === 'document' && result.url && result.url !== '#ai-answer') {
      // Navigate to the document and close the dialog
      window.location.href = result.url;
      onOpenChange(false);
    }

  }, [onOpenChange]);

  if (!open) return null;

  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange} label="Search Documentation">
      <div className="fixed inset-0 z-50 bg-black/50">
        <div className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-[80vh] flex flex-col">
          <h2 className="sr-only">Search Documentation</h2>
          
          <Command.Input
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            autoFocus
          />
          
          {loading && (
            <div className="mt-4 text-center text-gray-500 py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Searching...
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="mt-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                {results.map((result) => (
                  <div 
                    key={result.id} 
                    className={`p-3 border border-gray-200 dark:border-gray-600 rounded ${
                      result.type === 'document' 
                        ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors' 
                        : 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                    }`}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-2 flex items-center justify-between">
                      <span>{result.title}</span>
                      {result.type === 'document' && (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </div>
                    {result.type === 'ai-answer' ? (
                      <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {result.content}
                      </div>
                    )}
                    {result.type === 'document' && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-75">
                        Click to open documentation →
                      </div>
                    )}
                    {result.type === 'ai-answer' && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 opacity-75">
                        💡 AI-generated answer based on documentation
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!loading && results.length === 0 && query && (
            <div className="mt-4 text-center text-gray-500 py-8">
              No results found for "{query}"
            </div>
          )}
          
          <div className="mt-4 text-xs text-gray-500 text-center border-t border-gray-200 dark:border-gray-600 pt-3">
            {query ? 'Press Enter to search' : 'Type your search query and press Enter'}
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
} 