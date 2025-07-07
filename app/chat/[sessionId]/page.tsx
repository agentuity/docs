'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { ChatInterface } from '../components/ChatInterface';

interface ChatSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = use(params);

  // Basic session ID validation
  if (!sessionId || sessionId.length < 3) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <ChatInterface sessionId={sessionId} />
    </div>
  );
} 