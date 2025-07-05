'use client';

import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, RotateCcw, Trash2 } from 'lucide-react';
import { AgentuityLogo } from '../icons/AgentuityLogo';
import { MessageList } from './MessageList';
import { SearchInput } from './SearchInput';
import { useMessages } from './hooks/useMessages';
import { CustomSearchDialogProps } from './types';

export default function CustomSearchDialog(props: CustomSearchDialogProps) {
  const { open, onOpenChange } = props;
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    loading,
    sendMessage,
    handleRetry,
    handleClear,
    handleSourceClick
  } = useMessages();
  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);
  if (!open) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 backdrop-blur-xs data-[state=closed]:animate-fd-fade-out data-[state=open]:animate-fd-fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 w-full max-w-4xl h-[75vh] -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 z-50 flex flex-col focus:outline-none focus-visible:outline-none data-[state=closed]:animate-fd-fade-out"
        >
          <Dialog.Title className="sr-only">Search Documentation</Dialog.Title>
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                <AgentuityLogo className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-base font-medium text-gray-800 dark:text-gray-200">Search Documentation</h2>
                <p className="text-xs text-gray-500 dark:text-gray-500">Ask questions about Agentuity</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Messages Area */}
          <MessageList
            messages={messages}
            loading={loading}
            handleSourceClick={handleSourceClick}
          />

          {/* Input Area */}
          <div className="border-t border-gray-50 dark:border-gray-800 p-4">
            <div className="flex flex-col gap-2">
              <SearchInput
                currentInput={currentInput}
                setCurrentInput={setCurrentInput}
                loading={loading}
                sendMessage={(text) => {
                  sendMessage(text);
                  setCurrentInput('');
                }}
              />

              {/* Action Buttons */}
              {messages.length > 0 && (
                <div className="flex items-center justify-between text-xs mt-2">
                  <div className="flex gap-4">
                    <button
                      onClick={handleRetry}
                      disabled={loading}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry
                    </button>
                    <button
                      onClick={handleClear}
                      disabled={loading}
                      className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 