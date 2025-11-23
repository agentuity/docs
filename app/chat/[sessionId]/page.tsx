'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from "next/navigation";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { v4 as uuidv4 } from 'uuid';
import { ChatMessagesArea } from '../components/ChatMessagesArea';
import { CodeEditor } from '../components/CodeEditor';
import { Session, Message } from '../types';
import { useSessions } from '../SessionContext';
import { sessionService } from '../services/sessionService';
import { useCodeTabs } from '../hooks';
import { useStreamingMessage } from '../hooks';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChatSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | undefined>();
  const [creationError, setCreationError] = useState<string | null>(null);
  const { sessions, setSessions, revalidateSessions } = useSessions();

  // Code tabs management
  const {
    editorOpen,
    tabs: codeTabs,
    activeTabId,
    minimizedBlocks: minimizedCodeBlocks,
    setActiveTabId,
    addTab: addCodeTab,
    closeTab: closeCodeTab,
    toggleMinimized: toggleCodeBlockMinimized,
    updateContent: updateTabContent,
    closeEditor: toggleEditor,
  } = useCodeTabs();

  // Streaming message with typewriter effect
  const updateMessageText = useCallback((messageId: string, text: string) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.map(msg =>
          msg.id === messageId
            ? { ...msg, content: msg.content + text, isStreaming: true, statusMessage: undefined }
            : msg
        )
      };
    });
  }, []);

  const { streamingState, appendText, finishStreaming, cancelStreaming } = useStreamingMessage(updateMessageText);

  // Store current streaming message id for callbacks
  const currentAssistantIdRef = useRef<string | null>(null);

  const handleSendMessage = useCallback(async (content: string, sessionId: string) => {
    if (!content || !sessionId) return;

    const newMessage: Message = {
      id: uuidv4(),
      author: 'USER',
      content: content,
      timestamp: new Date().toISOString()
    };

    const assistantMessage: Message = {
      id: uuidv4(),
      author: 'ASSISTANT',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    };

    currentAssistantIdRef.current = assistantMessage.id;

    // Add messages to session
    setSession(prev => {
      if (!prev) return prev;
      return { ...prev, messages: [...prev.messages, newMessage, assistantMessage] };
    });

    try {
      await sessionService.addMessageToSessionStreaming(
        sessionId,
        newMessage,
        {
          onTextDelta: (textDelta) => {
            appendText(textDelta, assistantMessage.id);
          },

          onTutorialData: (tutorialData) => {
            setSession(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === assistantMessage.id ? { ...msg, tutorialData } : msg
                )
              };
            });
          },

          onDocumentationReferences: (documents) => {
            setSession(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === assistantMessage.id ? { ...msg, documentationReferences: documents } : msg
                )
              };
            });
          },

          onStatus: (message) => {
            setSession(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === assistantMessage.id ? { ...msg, statusMessage: message } : msg
                )
              };
            });
          },

          onFinish: (finalSession) => {
            // Flush remaining characters
            const remaining = finishStreaming();

            // Apply remaining text and final session
            setSession(prev => {
              if (!prev) return prev;
              const messagesWithRemaining = prev.messages.map(msg => {
                if (msg.id === assistantMessage.id && remaining) {
                  return { ...msg, content: msg.content + remaining, isStreaming: false };
                }
                return { ...msg, isStreaming: false };
              });
              return { ...prev, messages: messagesWithRemaining };
            });

            // Update with final session data
            const updatedFinalSession = {
              ...finalSession,
              messages: finalSession.messages.map(msg => ({ ...msg, isStreaming: false }))
            };
            setSession(updatedFinalSession);
            setSessions(prev => prev.map(s => s.sessionId === sessionId ? updatedFinalSession : s));
            currentAssistantIdRef.current = null;
          },

          onError: (error, details) => {
            console.error('Error sending message:', error, details ? `Details: ${details}` : '');
            cancelStreaming();
            currentAssistantIdRef.current = null;

            // Remove both messages on error
            setSession(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                messages: prev.messages.filter(msg =>
                  msg.id !== newMessage.id && msg.id !== assistantMessage.id
                )
              };
            });
          }
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      cancelStreaming();
      currentAssistantIdRef.current = null;

      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter(msg =>
            msg.id !== newMessage.id && msg.id !== assistantMessage.id
          )
        };
      });
    }
  }, [appendText, finishStreaming, cancelStreaming, setSessions]);

  // Load session or create new one
  useEffect(() => {
    const foundSession = sessions.find(s => s.sessionId === sessionId);
    if (foundSession) {
      setSession(foundSession);
      return;
    }

    const storageKey = `initialMessage:${sessionId}`;
    const initialMessage = sessionStorage.getItem(storageKey);
    if (!initialMessage) return;
    sessionStorage.removeItem(storageKey);

    const userMessage: Message = {
      id: uuidv4(),
      author: 'USER',
      content: initialMessage,
      timestamp: new Date().toISOString(),
    };
    const assistantPlaceholder: Message = {
      id: uuidv4(),
      author: 'ASSISTANT',
      content: '',
      timestamp: new Date().toISOString(),
    };
    const temporarySession: Session = {
      sessionId: sessionId as string,
      messages: [userMessage, assistantPlaceholder],
    };

    setSession(temporarySession);

    sessionService.createSession({ sessionId: sessionId as string, messages: [] })
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
  }, [sessionId, sessions, handleSendMessage, revalidateSessions]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden overflow-y-auto uity-scrollbar relative">
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
                  addCodeTab={addCodeTab}
                  minimizedCodeBlocks={minimizedCodeBlocks}
                  toggleCodeBlockMinimized={toggleCodeBlockMinimized}
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
          <Allotment.Pane minSize={450} preferredSize="60%">
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <CodeEditor
                codeTabs={codeTabs}
                activeTabId={activeTabId}
                setActiveTabId={setActiveTabId}
                updateTabContent={updateTabContent}
                closeCodeTab={closeCodeTab}
                toggleEditor={toggleEditor}
              />
            </div>
          </Allotment.Pane>
        )}
      </Allotment>
    </div>
  );
}
