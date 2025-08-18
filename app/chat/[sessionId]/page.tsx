'use client';

import { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import Split from 'react-split';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessagesArea } from '../components/ChatMessagesArea';
import { CodeEditor } from '../components/CodeEditor';
import styles from '../components/SplitPane.module.css';
import { Session, Message } from '../types';
import { useSessions } from '../SessionContext';
import { sessionService } from '../services/sessionService';

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

  const toggleEditor = () => { setEditorOpen(false) };
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
        <div className="flex-1 flex flex-col items-center h-full overflow-hidden">
          <div className="w-full max-w-3xl flex-1 flex flex-col h-full">
            {session && (
              <ChatMessagesArea
                session={session}
                handleSendMessage={handleSendMessage}
                setEditorContent={setEditorContent}
                setEditorOpen={() => { setEditorOpen(true) }}
              />
            )}
          </div>
        </div>
        {
          editorOpen && (<div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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
          </div>)
        }

      </Split>
    </div>
  );
} 