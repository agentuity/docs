'use client';

import { useRouter, useParams } from "next/navigation";
import { sessionService } from '../services/sessionService';
import { useEffect, useState } from 'react';
import { ChatMessagesArea } from '../components/ChatMessagesArea';
import Split from 'react-split';
import styles from '../components/SplitPane.module.css';
import { CodeEditor } from '../components/CodeEditor';
import { Session } from '../types';

export default function ChatSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | undefined>();
  const [editorContent, setEditorContent] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);

  const toggleEditor = () => setEditorOpen(!editorOpen);
  const stopServer = () => { };

  async function fetchCurrentSessionData() {
    // Get the specific session
    const sessionResponse = await sessionService.getSession(sessionId);
    if (sessionResponse.success && sessionResponse.data) {
      setSession(sessionResponse.data);
    }
  }

  async function handleSession() {
    // Check if this is a request for a new session
    if (sessionId === 'new') {
      const initialMessage = sessionStorage.getItem('initialMessage');
      sessionStorage.removeItem('initialMessage');

      if (initialMessage) {
        const newSessionId = crypto.randomUUID();
        const newSession: Session = {
          sessionId: newSessionId,
          messages: [{
            id: crypto.randomUUID(),
            author: 'USER',
            content: initialMessage,
            timestamp: new Date().toISOString()
          }]
        };
        setSession(newSession);

        const response = await sessionService.createSession(newSession);
        if (response.success && response.data) {
          router.replace(`/chat/${newSessionId}`);
          setSession(response.data);
          return;
        }
      }
    }
    else {
      fetchCurrentSessionData();
    }
  }

  useEffect(() => {
    handleSession();
  }, [sessionId]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {editorOpen ? (
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
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            {session && (
              <ChatMessagesArea
                session={session}
                setEditorContent={setEditorContent}
                setEditorOpen={setEditorOpen}
              />
            )}
          </div>

          {/* Code Editor */}
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
        </Split>
      ) : (
        <div className="h-full overflow-hidden">
          {session && (
            <ChatMessagesArea
              session={session}
              setEditorContent={setEditorContent}
              setEditorOpen={setEditorOpen}
            />
          )}
        </div>
      )}
    </div>
  );
} 