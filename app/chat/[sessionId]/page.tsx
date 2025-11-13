'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from "next/navigation";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { v4 as uuidv4 } from 'uuid';
import { ChatMessagesArea } from '../components/ChatMessagesArea';
import { CodeEditor } from '../components/CodeEditor';
import { Session, Message } from '../types';
import { useSessions } from '../SessionContext';
import { sessionService } from '../services/sessionService';
import { Skeleton } from '@/components/ui/skeleton';

// Simple hash function to create identifiers for code snippets
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

interface CodeTab {
  id: string;
  content: string;
  language: string;
  label: string;
  identifier?: string; // Used to prevent duplicates (e.g., file path or content hash)
}

export default function ChatSessionPage() {

  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [codeTabs, setCodeTabs] = useState<CodeTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const { sessions, setSessions, revalidateSessions } = useSessions();
  const [creationError, setCreationError] = useState<string | null>(null);
  const [minimizedCodeBlocks, setMinimizedCodeBlocks] = useState<Set<string>>(new Set());

  // Refs for character-by-character streaming
  const charQueueRef = useRef<string>('');
  const streamingMessageIdRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTypeTimeRef = useRef<number>(0);
  const typewriterLoopRef = useRef<((timestamp: number) => void) | null>(null);

  useEffect(() => {
    const typewriterLoop = (timestamp: number) => {
      const messageId = streamingMessageIdRef.current;
      if (!messageId) {
        animationFrameRef.current = null;
        return;
      }

      const timeSinceLastType = timestamp - lastTypeTimeRef.current;
      const queueLength = charQueueRef.current.length;

      let charsPerUpdate = 3;
      let updateInterval = 20;

      if (queueLength > 200) {
        charsPerUpdate = 10;
        updateInterval = 16;
      } else if (queueLength > 50) {
        charsPerUpdate = 5;
        updateInterval = 16;
      }

      if (queueLength > 0 && timeSinceLastType >= updateInterval) {
        const charsToAdd = charQueueRef.current.slice(0, charsPerUpdate);
        charQueueRef.current = charQueueRef.current.slice(charsPerUpdate);
        lastTypeTimeRef.current = timestamp;

        setSession(prev => {
          if (!prev) return prev;
          const updatedMessages = prev.messages.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                content: msg.content + charsToAdd,
                isStreaming: true,
                statusMessage: undefined
              };
            }
            return msg;
          });
          return { ...prev, messages: updatedMessages };
        });
      }

      // Continue animation loop while streaming
      if (streamingMessageIdRef.current) {
        animationFrameRef.current = requestAnimationFrame(typewriterLoop);
      } else {
        animationFrameRef.current = null;
      }
    };

    typewriterLoopRef.current = typewriterLoop;
  }, []);

  const handleSendMessage = async (content: string, sessionId: string) => {
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
            charQueueRef.current += textDelta;
            streamingMessageIdRef.current = assistantMessage.id;

            // Start the typewriter animation if not already running
            if (!animationFrameRef.current && typewriterLoopRef.current) {
              lastTypeTimeRef.current = performance.now();
              animationFrameRef.current = requestAnimationFrame(typewriterLoopRef.current);
            }
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

          onDocumentationReferences: (documents) => {
            setSession(prev => {
              if (!prev) return prev;
              const updatedMessages = prev.messages.map(msg =>
                msg.id === assistantMessage.id
                  ? { ...msg, documentationReferences: documents }
                  : msg
              );
              return { ...prev, messages: updatedMessages };
            });
          },

          onStatus: (message, category) => {
            // Update the assistant message's status
            setSession(prev => {
              if (!prev) return prev;
              const updatedMessages = prev.messages.map(msg =>
                msg.id === assistantMessage.id
                  ? { ...msg, statusMessage: message }
                  : msg
              );
              return { ...prev, messages: updatedMessages };
            });
          },

          onFinish: (finalSession) => {
            // Stop the animation loop
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }

            // Flush any remaining characters from queue immediately
            if (charQueueRef.current) {
              setSession(prev => {
                if (!prev) return prev;
                const updatedMessages = prev.messages.map(msg => {
                  if (msg.id === streamingMessageIdRef.current) {
                    return {
                      ...msg,
                      content: msg.content + charQueueRef.current,
                      isStreaming: false
                    };
                  }
                  return msg;
                });
                return { ...prev, messages: updatedMessages };
              });
            }

            // Reset refs
            charQueueRef.current = '';
            streamingMessageIdRef.current = null;

            // Set the final session with isStreaming: false
            const updatedFinalSession = {
              ...finalSession,
              messages: finalSession.messages.map(msg => ({
                ...msg,
                isStreaming: false
              }))
            };
            setSession(updatedFinalSession);
            setSessions(prev => prev.map(s => s.sessionId === sessionId ? updatedFinalSession : s));
          },

          onError: (error, details) => {
            console.error('Error sending message:', error, details ? `Details: ${details}` : '');

            // Stop the animation loop
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }

            // Reset refs
            charQueueRef.current = '';
            streamingMessageIdRef.current = null;

            // Remove both user and assistant messages since we didn't get a response
            setSession(prev => {
              if (!prev) return prev;
              const updatedMessages = prev.messages.filter(msg =>
                msg.id !== newMessage.id && msg.id !== assistantMessage.id
              );
              return { ...prev, messages: updatedMessages };
            });
          }
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);

      // Stop the animation loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Reset refs
      charQueueRef.current = '';
      streamingMessageIdRef.current = null;

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
  }, [sessionId, sessions]);

  // Cleanup effect to clear animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const toggleEditor = () => { setEditorOpen(false) };
  const stopServer = () => { };

  const addCodeTab = (code: string, language: string, label?: string, identifier?: string) => {
    // Generate identifier if not provided (hash of content + language)
    const tabIdentifier = identifier || `${language}-${hashCode(code)}`;

    // Check if a tab with this identifier already exists
    const existingTab = codeTabs.find(tab => tab.identifier === tabIdentifier);
    if (existingTab) {
      // Switch to the existing tab instead of creating a duplicate
      setActiveTabId(existingTab.id);
      setEditorOpen(true);
      // Minimize the code block in chat when opened in editor
      setMinimizedCodeBlocks(prev => new Set(prev).add(tabIdentifier));
      return;
    }

    // Create new tab
    const newTabId = uuidv4();

    // Determine the best label to display
    let tabLabel = label;
    if (!tabLabel && identifier) {
      // Extract filename from path if identifier looks like a path
      const pathParts = identifier.split('/');
      tabLabel = pathParts[pathParts.length - 1];
    }
    if (!tabLabel) {
      tabLabel = `${language} snippet`;
    }

    const newTab: CodeTab = {
      id: newTabId,
      content: code,
      language: language,
      label: tabLabel,
      identifier: tabIdentifier
    };

    setCodeTabs(prev => [...prev, newTab]);
    setActiveTabId(newTabId);
    setEditorOpen(true);
    // Minimize the code block in chat when opened in editor
    setMinimizedCodeBlocks(prev => new Set(prev).add(tabIdentifier));
  };

  const closeCodeTab = (tabId: string) => {
    setCodeTabs(prev => {
      const tabToClose = prev.find(tab => tab.id === tabId);
      const filtered = prev.filter(tab => tab.id !== tabId);

      // Remove from minimized set when tab is closed
      if (tabToClose?.identifier) {
        setMinimizedCodeBlocks(prevMinimized => {
          const newSet = new Set(prevMinimized);
          newSet.delete(tabToClose.identifier!);
          return newSet;
        });
      }

      if (filtered.length === 0) {
        setEditorOpen(false);
        setActiveTabId(null);
      } else if (activeTabId === tabId) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  };

  const toggleCodeBlockMinimized = (identifier: string) => {
    setMinimizedCodeBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(identifier)) {
        newSet.delete(identifier);
      } else {
        newSet.add(identifier);
      }
      return newSet;
    });
  };

  const updateTabContent = (tabId: string, content: string) => {
    setCodeTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, content } : tab
    ));
  };

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
                executionResult={''}
                serverRunning={false}
                executingFiles={[]}
                runCode={() => { }}
                stopServer={stopServer}
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