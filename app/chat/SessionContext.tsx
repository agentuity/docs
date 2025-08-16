import { createContext, useContext } from 'react';
import { Session } from './types';
import { KeyedMutator } from 'swr';

interface SessionContextType {
  sessions: Session[];
  setSessions: (updater: React.SetStateAction<Session[]>, options?: { revalidate: boolean }) => void;
  currentSessionId: string;
  revalidateSessions?: KeyedMutator<Session[]>;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSessions = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessions must be used within a SessionProvider');
  }
  return context;
};
