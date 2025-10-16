'use client';

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

interface SimpleCodeBlockProps {
  content: string;
  language: string;
}

export default function CodeBlock({
  content,
  language
}: SimpleCodeBlockProps) {
  return (
    <div className="agentuity-card-elevated rounded-xl overflow-hidden">
      {/* Custom header with language label */}
      <div className="flex items-center justify-between p-2 bg-black/5 dark:bg-black/20 border-b border-black/2 dark:border-white/8">
        <span className="text-sm text-gray-200">{language}</span>
      </div>

      {/* Syntax-highlighted code block with built-in copy button */}
      <div className="[&>figure]:my-0 [&>figure]:rounded-none [&>figure]:border-0">
        <DynamicCodeBlock code={content} lang={language || 'text'} />
      </div>
    </div>
  );
} 