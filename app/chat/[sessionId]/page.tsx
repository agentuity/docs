'use client';

import { ChatInterface } from '../components/ChatInterface';
import { ChatProvider } from '../context/ChatContext';

interface ChatSessionPageProps {
  params: {
    sessionId: string;
  };
}

export default function ChatSessionPage({ params }: ChatSessionPageProps) {
  return (
    <ChatProvider initialSessionId={params.sessionId}>
      <ChatInterface sessionId={params.sessionId} />
    </ChatProvider>
  );
} 