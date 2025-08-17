'use client';

import { useParams } from "next/navigation";
import { sessionService } from '../services/sessionService';
import { useEffect, useState, useCallback } from 'react';
import { ChatMessagesArea } from '../components/ChatMessagesArea';
import Split from 'react-split';
import styles from '../components/SplitPane.module.css';
import { CodeEditor } from '../components/CodeEditor';
import { Session, Message } from '../types';
import { useSessions } from '../SessionContext';
import { v4 as uuidv4 } from 'uuid';

export default function ChatSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | undefined>();
  const [editorOpen, setEditorOpen] = useState(false);
  const { sessions, setSessions, revalidateSessions } = useSessions();

  const [creationError, setCreationError] = useState<string | null>(null);

  // Handle sending a new message
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
      timestamp: new Date().toISOString()
    };

    try {
      setSession(prevSession => {
        if (!prevSession) return prevSession;
        return {
          ...prevSession,
          messages: [...prevSession.messages, newMessage]
        };
      });


      setSession(prevSession => {
        if (!prevSession) return prevSession;
        return {
          ...prevSession,
          messages: [...prevSession.messages, assistantMessage]
        };
      });

      // Use streaming API for real-time updates
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
            // Update the assistant message with tutorial data
            setSession(prev => {
              if (!prev) return prev; // Guard against undefined
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

  // Modified useEffect to handle creation
  useEffect(() => {
    const foundSession = sessions.find(s => s.sessionId === sessionId);
    if (foundSession) {
      setSession(foundSession);
      return;
    }

    const initialMessage = sessionStorage.getItem('initialMessage');
    if (!initialMessage) {
      return;
    }
    sessionStorage.removeItem('initialMessage');
    const newSession: Session = {
      sessionId: sessionId as string,
      messages: []
    };

    setSession(newSession);

    // Persist to server
    sessionService.createSession(newSession)
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

  if (creationError) {
    return <div>Error creating session: {creationError} <button onClick={() => revalidateSessions?.()}>Retry</button></div>;
  }
  if (!session) {
    return <div>Session not found</div>;
  }

  const toggleEditor = () => {setEditorOpen(false)};
  const stopServer = () => { };


  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden  overflow-y-auto agentuity-scrollbar">
      <Split
        className={styles.split}
        sizes={[60, 40]}
        minSize={300}
        gutterSize={4}
        gutterStyle={() => ({
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          cursor: 'col-resize'
        })}
        style={{ height: '100%', display: 'flex', overflow: 'hidden' }}
      >
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col items-center h-full overflow-hidden">
          <div className="w-full max-w-3xl flex-1 flex flex-col h-full">
            {session && (
              <ChatMessagesArea
                session={session}
                handleSendMessage={handleSendMessage}
                setEditorContent={() => { }}
                setEditorOpen={() => {setEditorOpen(true)}}
              />
            )}
          </div>
        </div>
        {/* Code Editor */}
        {
          editorOpen && (<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <CodeEditor
              executionResult={''}
              serverRunning={false}
              executingFiles={[]}
              runCode={() => { }}
              stopServer={stopServer}
              editorContent={''}
              setEditorContent={() => { }}
              toggleEditor={toggleEditor}
            />
          </div>)
        }
        
      </Split>
    </div>
  );
} 