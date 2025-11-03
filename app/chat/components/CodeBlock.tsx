'use client';

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { ChevronDown } from 'lucide-react';

interface SimpleCodeBlockProps {
  content: string;
  language: string;
  label?: string;
  identifier?: string;
  onOpenInEditor?: ((code: string, language: string, label?: string, identifier?: string) => void) | null;
  minimizedCodeBlocks?: Set<string>;
  toggleCodeBlockMinimized?: (identifier: string) => void;
}

export default function CodeBlock({
  content,
  language,
  label,
  identifier,
  onOpenInEditor,
  minimizedCodeBlocks,
  toggleCodeBlockMinimized
}: SimpleCodeBlockProps) {
  // Generate identifier if not provided (same logic as in page.tsx)
  const blockIdentifier = identifier || `${language}-${hashCode(content)}`;
  const isMinimized = minimizedCodeBlocks?.has(blockIdentifier) ?? false;

  // Handle expanding the code block
  const handleExpand = () => {
    if (toggleCodeBlockMinimized) {
      toggleCodeBlockMinimized(blockIdentifier);
    }
  };

  // If minimized, show compact view
  if (isMinimized) {
    return (
      <div className="agentuity-card-elevated rounded-xl overflow-hidden">
        <button
          onClick={handleExpand}
          className="w-full flex items-center justify-between p-3 hover:bg-black/10 transition-colors text-left"
          title="Click to show code"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-200">
              {label || `${language} code`}
            </span>
            <span className="text-xs text-gray-400 bg-black/20 px-2 py-0.5 rounded">
              Open in editor
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    );
  }

  // Full code block view
  return (
    <div className="agentuity-card-elevated rounded-xl overflow-hidden">
      {/* Custom header with language label and action buttons */}
      <div className="flex items-center justify-between p-2 bg-black/5 dark:bg-black/20 border-b border-black/2 dark:border-white/8">
        <span className="text-sm text-gray-200">{language}</span>
        {onOpenInEditor && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenInEditor(content, language, label, identifier)}
              className="text-sm text-gray-400 hover:text-white transition-colors"
              title="Open in editor"
              aria-label="Open in editor"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Syntax-highlighted code block with built-in copy button */}
      <div className="[&>figure]:my-0 [&>figure]:rounded-none [&>figure]:border-0">
        <DynamicCodeBlock code={content} lang={language || 'text'} />
      </div>
    </div>
  );
}

// Simple hash function (same as in page.tsx)
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
} 