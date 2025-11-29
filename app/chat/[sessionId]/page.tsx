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

  // Abort controller for cancelling requests
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const { streamingState, startStreaming, appendText, finishStreaming, cancelStreaming } = useStreamingMessage(updateMessageText);

  // Store current streaming message id for callbacks
  const currentAssistantIdRef = useRef<string | null>(null);
  
  // Uses currentAssistantIdRef so callbacks always reference the active message ID
  const createStreamingCallbacks = useCallback((
    onComplete: (finalSession: Session) => void,
    onErrorCleanup?: () => void
  ) => ({
    onTextDelta: (textDelta: string) => {
      if (!currentAssistantIdRef.current) return;
      appendText(textDelta, currentAssistantIdRef.current);
    },
    onTutorialData: (tutorialData: TutorialData) => {
      if (!currentAssistantIdRef.current) return;
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === currentAssistantIdRef.current ? { ...msg, tutorialData } : msg
          )
        };
      });
    },
    onDocumentationReferences: (documents: string[]) => {
      if (!currentAssistantIdRef.current) return;
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === currentAssistantIdRef.current ? { ...msg, documentationReferences: documents } : msg
          )
        };
      });
    },
    onStatus: (statusMessage: string) => {
      if (!currentAssistantIdRef.current) return;
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === currentAssistantIdRef.current ? { ...msg, statusMessage } : msg
          )
        };
      });
    },
    onFinish: (finalSession: Session) => {
      const remaining = finishStreaming();

      // Apply remaining text then sync with server
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(msg => {
            if (msg.id === currentAssistantIdRef.current && remaining) {
              return { ...msg, content: msg.content + remaining, isStreaming: false };
            }
            return { ...msg, isStreaming: false };
          })
        };
      });

      const updatedFinalSession = {
        ...finalSession,
        messages: finalSession.messages.map(msg => ({ ...msg, isStreaming: false }))
      };

      onComplete(updatedFinalSession);
      currentAssistantIdRef.current = null;
    },
    onError: (error: string, details?: string) => {
      console.error('Streaming error:', error, details);
      cancelStreaming();
      currentAssistantIdRef.current = null;
      if (onErrorCleanup) {
        onErrorCleanup();
      }
    }
  }), [appendText, finishStreaming, cancelStreaming, setSession]);

  // Stop generating handler
  const handleStopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancelStreaming();

    // Mark current message as stopped
    if (currentAssistantIdRef.current) {
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === currentAssistantIdRef.current
              ? { ...msg, isStreaming: false, content: msg.content || '*(Generation stopped)*' }
              : msg
          )
        };
      });
      currentAssistantIdRef.current = null;
    }
  }, [cancelStreaming]);

  // Core streaming logic for sending new messages
  const streamAssistantResponse = useCallback(async (
    targetSessionId: string,
    userMessage: Message,
    assistantMessageId: string,
    onErrorCleanup: () => void
  ) => {
    abortControllerRef.current = new AbortController();
    currentAssistantIdRef.current = assistantMessageId;

    try {
      await sessionService.addMessageToSessionStreaming(
        targetSessionId,
        userMessage,
        createStreamingCallbacks(
          (updatedFinalSession) => {
            setSession(updatedFinalSession);
            setSessions(prev => prev.map(s => s.sessionId === targetSessionId ? updatedFinalSession : s));
          },
          onErrorCleanup
        ),
        abortControllerRef.current.signal
      );
    } catch (error) {
      console.error('Streaming error:', error);
      cancelStreaming();
      currentAssistantIdRef.current = null;
      onErrorCleanup();
    }
  }, [createStreamingCallbacks, cancelStreaming, setSessions]);

  // Send a new message
  const handleSendMessage = useCallback(async (content: string, targetSessionId: string) => {
    if (!content || !targetSessionId) return;

    const userMessage: Message = {
      id: uuidv4(),
      author: 'USER',
      content,
      timestamp: new Date().toISOString()
    };

    const assistantMessage: Message = {
      id: uuidv4(),
      author: 'ASSISTANT',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    };

    // Add both messages to session
    setSession(prev => {
      if (!prev) return prev;
      return { ...prev, messages: [...prev.messages, userMessage, assistantMessage] };
    });

    // Stream the response
    await streamAssistantResponse(
      targetSessionId,
      userMessage,
      assistantMessage.id,
      () => {
        // On error: remove both messages
        setSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.filter(msg =>
              msg.id !== userMessage.id && msg.id !== assistantMessage.id
            )
          };
        });
      }
    );
  }, [streamAssistantResponse]);

  // Retry/regenerate the response
  const handleRetry = useCallback(async () => {
    if (!sessionId) return;

    abortControllerRef.current = new AbortController();
    startStreaming('pending'); // Hide retry button immediately

    // Optimistically clear entire message for clean regeneration UX
    setSession(prev => {
      if (!prev) return prev;
      const lastAssistantIndex = [...prev.messages].reverse().findIndex(m => m.author === 'ASSISTANT');
      if (lastAssistantIndex === -1) return prev;
      const actualIndex = prev.messages.length - 1 - lastAssistantIndex;
      return {
        ...prev,
        messages: prev.messages.map((msg, idx) =>
          idx === actualIndex
            ? {
                ...msg,
                content: '',
                documentationReferences: undefined,
                tutorialData: undefined
              }
            : msg
        )
      };
    });

    await sessionService.regenerate(
      sessionId,
      {
        onStart: ({ action, messageId }) => {
          currentAssistantIdRef.current = messageId;
          startStreaming(messageId);

          setSession(prev => {
            if (!prev) return prev;

            if (action === 'replace') {
              // Mark as streaming - content already cleared optimistically above
              return {
                ...prev,
                messages: prev.messages.map(msg =>
                  msg.id === messageId ? { ...msg, isStreaming: true } : msg
                )
              };
            } else {
              // Add new assistant placeholder (agent never responded case)
              return {
                ...prev,
                messages: [...prev.messages, {
                  id: messageId,
                  author: 'ASSISTANT' as const,
                  content: '',
                  timestamp: new Date().toISOString(),
                  isStreaming: true
                }]
              };
            }
          });
        },
        ...createStreamingCallbacks(
          (updatedFinalSession) => {
            setSession(updatedFinalSession);
            setSessions(prev => prev.map(s => s.sessionId === sessionId ? updatedFinalSession : s));
          },
          () => revalidateSessions?.()
        )
      },
      abortControllerRef.current.signal
    );
  }, [sessionId, startStreaming, createStreamingCallbacks, setSessions, revalidateSessions]);

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
                  isStreaming={streamingState.isStreaming}
                  onStopGenerating={handleStopGenerating}
                  onRetry={handleRetry}
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
