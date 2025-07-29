import { useState, useCallback } from 'react';
import { ChatSession, ConversationMessage, TutorialData } from '../types';

// Generate unique IDs
const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initial dummy session for development
const createInitialSession = (sessionId: string): ChatSession => ({
  id: sessionId,
  messages: [],
  currentFiles: {},
  createdAt: new Date(),
  updatedAt: new Date()
});

interface UseSessionManagementProps {
  initialSessionId: string;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  setConversationHistory: React.Dispatch<React.SetStateAction<ConversationMessage[]>>;
  setTutorialData: React.Dispatch<React.SetStateAction<TutorialData | undefined>>;
}

export function useSessionManagement({
  initialSessionId,
  setMessages,
  setConversationHistory,
  setTutorialData
}: UseSessionManagementProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([createInitialSession(initialSessionId)]);
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);

  // Create a new chat session
  const createNewSession = useCallback(() => {
    const newSessionId = generateId();
    const newSession = createInitialSession(newSessionId);

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setConversationHistory([]); // Reset conversation history for new session
    setTutorialData(undefined); // Reset tutorial data for new session

    // Update URL
    window.history.pushState({}, '', `/chat/${newSessionId}`);
  }, [setMessages, setConversationHistory, setTutorialData]);

  // Select an existing session
  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setMessages([]); // In a real app, load messages for the session
    setConversationHistory([]); // Reset conversation history when changing sessions
    setTutorialData(undefined); // Reset tutorial data when changing sessions

    // Update URL
    window.history.pushState({}, '', `/chat/${sessionId}`);
  }, [setMessages, setConversationHistory, setTutorialData]);

  return {
    sessions,
    currentSessionId,
    createNewSession,
    selectSession
  };
} 