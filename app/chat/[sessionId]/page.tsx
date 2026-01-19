'use client';

import { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { v4 as uuidv4 } from 'uuid';
import { ChatMessagesArea } from '../components/ChatMessagesArea';
import { CodeEditor } from '../components/CodeEditor';
import type { Session, Message } from '../types';
import { useSessions } from '../SessionContext';
import { sessionService } from '../services/sessionService';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState<string>('');
  const { sessions, setSessions, revalidateSessions } = useSessions();
  const [creationError, setCreationError] = useState<string | null>(null);


  const handleSendMessage = async (content: string, sessionId: string) => {
    if (!content || !sessionId) return;

    const newMessage: Message = {
      id: uuidv4(),
      author: 'USER',
      content: content,
    };

    const assistantMessage: Message = {
      id: uuidv4(),
      author: 'ASSISTANT',
      content: '',
    };

    try {
      setSession(prevSession => {
        if (!prevSession) return prevSession;
        return {
          ...prevSession,
          messages: [...prevSession.messages, newMessage, assistantMessage]
        };
      });

      await sessionService.addMessageToSessionStreaming(
        sessionId,
        newMessage,
        {
          onTextDelta: (textDelta) => {
            setSession(prev => {
              if (!prev) return prev;
              const updatedMessages = prev.messages.map(msg => {
                if (msg.id === assistantMessage.id) {
                  return {
                    ...msg,
                    content: msg.content + textDelta
                  };
                }
                return msg;
              });
              return { ...prev, messages: updatedMessages };
            });
          },

          onTutorialData: (tutorialData) => {
            setSession(prev => {
              if (!prev) return prev;
              const updatedMessages = prev.messages.map(msg =>
                msg.id === assistantMessage.id
                  ? { ...msg, tutorialData: tutorialData }
                  : msg
              );
              return { ...prev, messages: updatedMessages };
            });
          },

          onFinish: (finalSession) => {
            setSession(finalSession);
            setSessions(prev => prev.map(s => s.sessionId === sessionId ? finalSession : s));
          },

          onError: (error) => {
            console.error('Error sending message:', error);
            setSession(prev => {
              if (!prev) return prev;
              const updatedMessages = prev.messages.map(msg =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
                  : msg
              );
              return { ...prev, messages: updatedMessages };
            });
          }
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      setSession(prevSession => {
        if (!prevSession) return prevSession;
        const filteredMessages = prevSession.messages.filter(msg =>
          msg.id !== newMessage.id && msg.id !== assistantMessage.id
        );
        return { ...prevSession, messages: filteredMessages };
      });
    }
  };

  useEffect(() => {
    const foundSession = sessions.find(s => s.sessionId === sessionId);
    if (foundSession) {
      setSession(foundSession);
      return;
    }

    const storageKey = `initialMessage:${sessionId}`;
    const initialMessage = sessionStorage.getItem(storageKey);
    if (!initialMessage) {
      return;
    }
    sessionStorage.removeItem(storageKey);

    const userMessage: Message = {
      id: uuidv4(),
      author: 'USER',
      content: initialMessage,
    };
    const assistantPlaceholder: Message = {
      id: uuidv4(),
      author: 'ASSISTANT',
      content: '',
    };
    const temporarySession: Session = {
      sessionId: sessionId as string,
      messages: [userMessage, assistantPlaceholder],
    };

    setSession(temporarySession);

    sessionService.createSession({
      sessionId: sessionId as string,
      messages: []
    })
      .then(async response => {
        if (response.success && response.data) {
          setSession(response.data);
          await handleSendMessage(initialMessage, sessionId);
        } else {
          setCreationError(response.error || 'Failed to create session');
          revalidateSessions?.();
        }
      })
      .catch(error => {
        setCreationError(error.message || 'Error creating session');
        revalidateSessions?.();
      });
  }, [sessionId]);


  const toggleEditor = () => { setEditorOpen(false) };
  const stopServer = () => { };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden overflow-y-auto uity-scrollbar relative">
      {/* Non-blocking error banner */}
      {creationError && (
        <div className="absolute top-2 right-2 z-50 bg-red-500/20 border border-red-500/40 text-red-200 text-sm px-3 py-2 rounded-md backdrop-blur">
          <div className="flex items-center gap-3">
            <span>Error creating session: {creationError}</span>
            <button
              onClick={() => revalidateSessions?.()}
              className="px-2 py-0.5 text-xs rounded bg-red-500/30 hover:bg-red-500/40 border border-red-500/50"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <Allotment>
        <Allotment.Pane minSize={300}>
          <div className="flex-1 flex flex-col items-center h-full overflow-hidden">
            <div className="w-full max-w-3xl flex-1 flex flex-col h-full">
              {session ? (
                <ChatMessagesArea
                  session={session}
                  handleSendMessage={handleSendMessage}
                  setEditorContent={setEditorContent}
                  setEditorOpen={() => { setEditorOpen(true) }}
                />
              ) : (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Allotment.Pane>
        {editorOpen && (
          <Allotment.Pane>
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <CodeEditor
                executionResult={''}
                serverRunning={false}
                executingFiles={[]}
                runCode={() => { }}
                stopServer={stopServer}
                editorContent={editorContent}
                setEditorContent={setEditorContent}
                toggleEditor={toggleEditor}
              />
            </div>
          </Allotment.Pane>
        )}
      </Allotment>
    </div>
  );
}