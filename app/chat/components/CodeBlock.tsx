'use client';

import { useState, useEffect } from 'react';
import { Play, Loader2, FileCode, AlertCircle, CheckCircle } from 'lucide-react';
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
  const textareaRef = useAutoResize(code);

  useEffect(() => {
    setCode(content);
  }, [content]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    onCodeChange(newCode);
  };

  const handleExecute = () => {
    onExecute(code, filename);
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

  const getLanguageIcon = (lang: string) => {
    switch (lang) {
      case 'javascript':
      case 'js':
        return '🟨';
      case 'python':
      case 'py':
        return '🐍';
      case 'typescript':
      case 'ts':
        return '🔷';
      default:
        return '📄';
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
              <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/8">
        <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-800/50 rounded-lg flex items-center justify-center border border-white/10">
                          <FileCode className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-sm font-semibold text-gray-200">
            {getLanguageIcon(language)} {filename}
          </span>
        </div>

        {editable && (
          <button
            onClick={handleExecute}
            disabled={loading}
            className={`group flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${loading
                ? 'agentuity-button text-gray-500 cursor-not-allowed'
                : 'agentuity-button-primary bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-cyan-400 hover:scale-105 active:scale-95'
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 transition-transform group-hover:scale-110" />
                Run Code
              </>
            )}
          </button>
        )}
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
            placeholder="Enter your code here..."
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