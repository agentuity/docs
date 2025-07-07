'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AgentuityLogo } from '@/components/icons/AgentuityLogo';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-create a new session and redirect
    const createSession = async () => {
      try {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const data = await response.json();
        router.push(`/chat/${data.sessionId}`);
      } catch (error) {
        console.error('Error creating session:', error);
        // Fallback to a generated session ID
        const fallbackSessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        router.push(`/chat/${fallbackSessionId}`);
      }
    };

    createSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
          <AgentuityLogo className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Creating new chat session...
          </span>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-500">
          You'll be redirected to your new chat in a moment
        </p>
      </div>
    </div>
  );
} 