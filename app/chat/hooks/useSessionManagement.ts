import { useState, useEffect, useCallback } from 'react';
import { ChatSession, ChatMessage } from '../types';
import { storageService } from '../services/api';

interface UseSessionManagementOptions {
  initialSessionId: string;
}

interface UseSessionManagementResult {
  sessions: ChatSession[];
  currentSessionId: string;
  messages: ChatMessage[];
  createNewSession: () => string;
  selectSession: (sessionId: string) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
}

// Helper function to generate unique IDs
const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export function useSessionManagement({
  initialSessionId
}: UseSessionManagementOptions): UseSessionManagementResult {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load sessions from storage on mount
  useEffect(() => {
    const loadedSessions = storageService.getSessions();
    
    if (loadedSessions.length === 0) {
      // Create a default session if none exist
      const defaultSession: ChatSession = {
        id: initialSessionId || generateId(),
        messages: [],
        currentFiles: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setSessions([defaultSession]);
      setCurrentSessionId(defaultSession.id);
    } else {
      setSessions(loadedSessions);
      
      // If initialSessionId is provided and exists in loaded sessions, use it
      // Otherwise use the first session
      if (initialSessionId && loadedSessions.some(s => s.id === initialSessionId)) {
        setCurrentSessionId(initialSessionId);
        
        // Load messages for this session
        const session = loadedSessions.find(s => s.id === initialSessionId);
        if (session) {
          setMessages(session.messages);
        }
      } else {
        setCurrentSessionId(loadedSessions[0].id);
        setMessages(loadedSessions[0].messages);
      }
    }
    
    setInitialized(true);
  }, [initialSessionId]);

  // Save sessions when they change
  useEffect(() => {
    if (!initialized) return;
    
    storageService.saveSessions(sessions);
  }, [sessions, initialized]);

  // Create a new session
  const createNewSession = useCallback(() => {
    const newSessionId = generateId();
    const newSession: ChatSession = {
      id: newSessionId,
      messages: [],
      currentFiles: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
    
    // Update URL
    window.history.pushState({}, '', `/chat/${newSessionId}`);
    
    return newSessionId;
  }, []);

  // Select an existing session
  const selectSession = useCallback((sessionId: string) => {
    if (sessionId === currentSessionId) return;
    
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return;
    }
    
    setCurrentSessionId(sessionId);
    setMessages(session.messages);
    
    // Update URL
    window.history.pushState({}, '', `/chat/${sessionId}`);
  }, [sessions, currentSessionId]);

  // Add a message to the current session
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    
    // Update the session with the new message
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId
        ? {
            ...session,
            messages: [...session.messages, message],
            updatedAt: new Date()
          }
        : session
    ));
  }, [currentSessionId]);

  // Update a message in the current session
  const updateMessage = useCallback((messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
    
    // Update the session with the modified message
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId
        ? {
            ...session,
            messages: session.messages.map(msg => 
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
            updatedAt: new Date()
          }
        : session
    ));
  }, [currentSessionId]);

  // Clear all messages in the current session
  const clearMessages = useCallback(() => {
    setMessages([]);
    
    // Update the session to clear messages
    setSessions(prev => prev.map(session => 
      session.id === currentSessionId
        ? {
            ...session,
            messages: [],
            updatedAt: new Date()
          }
        : session
    ));
  }, [currentSessionId]);

  return {
    sessions,
    currentSessionId,
    messages,
    createNewSession,
    selectSession,
    addMessage,
    updateMessage,
    clearMessages
  };
} 