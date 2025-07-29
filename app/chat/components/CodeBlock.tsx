'use client';

import { useState, useEffect } from 'react';
import { Play, Loader2, FileCode, AlertCircle, CheckCircle, Copy, Check } from 'lucide-react';
import { CodeBlockProps } from '../types';
import { useAutoResize } from '../hooks/useAutoResize';

export default function CodeBlock({
  filename,
  content,
  language,
  editable,
  onExecute,
  onCodeChange,
  executionResult,
  loading
}: CodeBlockProps) {
  const [code, setCode] = useState(content);
  const [collapsed, setCollapsed] = useState(false);
  const { textareaRef } = useAutoResize(code);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(content);
  }, [content]);

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    setCode(content);
  }, [content]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onCodeChange(newCode);
  };


  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      onCodeChange(newCode);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const getExecutionStatus = () => {
    if (loading) return 'running';
    if (executionResult?.success) return 'success';
    if (executionResult?.error) return 'error';
    return 'idle';
  };

  const status = getExecutionStatus();

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

      {/* Code Editor */}
      <div className="relative bg-gray-50/50 dark:bg-gray-950/50 backdrop-blur-sm">
        {editable ? (
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-4 text-sm font-mono bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500/60 dark:placeholder-gray-400/60 resize-none border-0 focus:outline-none focus:ring-0 min-h-[140px] overflow-hidden leading-relaxed"
            spellCheck={false}
            readOnly={true}
          />
        ) : (
          <pre className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200 overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
        )}
      </div>
      {/* Execution Result */}
      {executionResult && (
        <div className="border-t border-white/20 dark:border-gray-700/30">
          <div className={`flex items-center gap-3 p-3 text-sm backdrop-blur-sm ${status === 'success'
            ? 'bg-green-50/70 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-b border-green-200/30 dark:border-green-700/30'
            : 'bg-red-50/70 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-b border-red-200/30 dark:border-red-700/30'
            }`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${status === 'success'
              ? 'bg-green-100/70 dark:bg-green-800/30'
              : 'bg-red-100/70 dark:bg-red-800/30'
              }`}>
              {status === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1">
              <span className="font-semibold">
                {status === 'success' ? 'Executed successfully' : 'Execution failed'}
              </span>
              {executionResult.executionTime && (
                <span className="text-gray-300 ml-2">
                  ({executionResult.executionTime}ms)
                </span>
              )}
            </div>
          </div>

          {(executionResult.output || executionResult.error) && (
            <div className="p-4 bg-gray-900/90 dark:bg-gray-950/90 backdrop-blur-sm">
              <pre className="text-sm text-gray-200 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto leading-relaxed font-mono">
                {executionResult.output || executionResult.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 