'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface SimpleCodeBlockProps {
  content: string;
  language: string;
}

export default function CodeBlock({
  content,
  language
}: SimpleCodeBlockProps) {
  const [code, setCode] = useState(content);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(content);
  }, [content]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="agentuity-card-elevated rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-black/20 border-b border-white/8">
        <span className="text-sm text-gray-200">{language}</span>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="group flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 agentuity-button-primary bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-cyan-400 hover:scale-105 active:scale-95"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <textarea
        value={code}
        readOnly={true}
        className="w-full p-4 text-sm font-mono bg-transparent text-gray-800 dark:text-gray-200 border-0 focus:outline-none focus:ring-0 overflow-x-auto leading-relaxed"
        style={{ minHeight: '200px', maxHeight: '500px' }}
        spellCheck={false}
        onChange={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = `${Math.min(e.target.scrollHeight, 500)}px`;
        }}
      />
    </div>
  );
} 