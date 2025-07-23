'use client';

import { use } from 'react';
import { ChatInterface } from '../components/ChatInterface';
import { ChatProvider } from '../context/ChatContext';

interface ChatSessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function ChatSessionPage({ params }: ChatSessionPageProps) {
  const { sessionId } = use(params);
  
  return (
    <ChatProvider initialSessionId={sessionId}>
      <ChatInterface sessionId={sessionId} />
    </ChatProvider>
  );
} 