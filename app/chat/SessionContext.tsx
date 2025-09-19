'use client';
import { createContext, useContext } from 'react';
import { Session } from './types';

interface SessionContextType {
  sessions: Session[];
  setSessions: (updater: React.SetStateAction<Session[]>, options?: { revalidate: boolean }) => void;
  currentSessionId: string;
  // A simple trigger to revalidate sessions; implementation may vary under the hood
  revalidateSessions?: () => void | Promise<any>;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSessions = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessions must be used within a SessionProvider');
  }
  return context;
};
