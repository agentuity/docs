'use client';

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { Code } from 'lucide-react';
interface SimpleCodeBlockProps {
  content: string;
  language: string;
  onOpenInEditor?: (() => void) | null;
}

export default function CodeBlock({
  content,
  language,
  onOpenInEditor
}: SimpleCodeBlockProps) {
  return (
    <div className="agentuity-card-elevated rounded-xl overflow-hidden">
      {/* Custom header with language label */}
      <div className="flex items-center justify-between p-2 bg-black/5 dark:bg-black/20 border-b border-black/2 dark:border-white/8">
        <span className="text-sm text-gray-200">{language}</span>
        {onOpenInEditor && (
          <button
            onClick={onOpenInEditor}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-black/30 rounded-md transition-colors"
            title="Open in editor"
            aria-label="Open in editor"
          >
            <Code className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {/* Syntax-highlighted code block with built-in copy button */}
      <div className="[&>figure]:my-0 [&>figure]:rounded-none [&>figure]:border-0">
        <DynamicCodeBlock code={content} lang={language || 'text'} />
      </div>
    </div>
  );
} 