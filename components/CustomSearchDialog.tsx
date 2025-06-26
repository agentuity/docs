'use client';

import { useState, useCallback } from 'react';
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
  const [hasSearched, setHasSearched] = useState(false);

  // Perform search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Reset search state when user starts typing again
    if (hasSearched) {
      setHasSearched(false);
      setResults([]);
    }
  }, [hasSearched]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch(query);
    }
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  }, [query, performSearch, onOpenChange]);

  const handleResultClick = useCallback((result: SearchResult) => {
    if (result.type === 'ai-answer') {
      // For AI answers, keep dialog open for now (could copy to clipboard or show full answer)
      return;
    }
    
    if (result.url && result.url !== '#ai-answer') {
      window.location.href = result.url;
      onOpenChange(false);
    }
  }, [onOpenChange]);

  const getResultStyles = (result: SearchResult) => {
    const baseStyles = "p-3 rounded border-b border-gray-200 dark:border-gray-600 last:border-b-0";
    
    if (result.type === 'ai-answer') {
      return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500`;
    }
    
    if (result.type === 'document') {
      return `${baseStyles} hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`;
    }
    
    return `${baseStyles} hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => onOpenChange(false)}>
      <div 
        className="fixed left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="search"
          placeholder="Search documentation... (Press Enter to search)"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          autoFocus
        />
        
        {loading && (
          <div className="mt-4 text-center text-gray-500 py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Searching...
          </div>
        )}
        
        {!loading && hasSearched && (
          <div className="mt-4 flex-1 overflow-y-auto">
            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <div 
                    key={result.id} 
                    className={getResultStyles(result)}
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {result.title}
                    </div>
                    <div className={`text-sm ${
                      result.type === 'ai-answer' 
                        ? 'text-gray-700 dark:text-gray-300 leading-relaxed' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {result.content}
                    </div>
                    {result.type === 'document' && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 opacity-75">
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
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🔍</div>
                No results found
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500 text-center border-t border-gray-200 dark:border-gray-600 pt-3">
          {!hasSearched && query ? 'Press Enter to search' : 
           hasSearched ? `${results.length} result(s) for "${query}"` :
           'Type your search query and press Enter'}
        </div>
        
        <div className="mt-2 text-xs text-gray-400 text-center">
          Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Enter</kbd> to search • <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
} 