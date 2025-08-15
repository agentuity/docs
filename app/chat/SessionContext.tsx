import { createContext, useContext } from 'react';
import { Session } from './types';

interface SessionContextType {
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  currentSessionId: string;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSessions = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessions must be used within a SessionProvider');
  }
  return context;
};
