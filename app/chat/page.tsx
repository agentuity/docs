'use client';

import { ChatInterface } from './components/ChatInterface';
import { ChatProvider } from './context/ChatContext';

interface ChatPageProps {
  params: {
    sessionId?: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  // Use the provided sessionId or generate a default one
  const sessionId = params.sessionId || 'default-session';

  return (
    <ChatProvider initialSessionId={sessionId}>
      <ChatInterface sessionId={sessionId} />
    </ChatProvider>
  );
} 