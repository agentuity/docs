import { useState, useCallback } from 'react';
import type { Message, TutorialData, StreamingChunk } from '../types';
import { getCurrentTimestamp } from './dateUtils';

// Generate unique IDs
const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface UseStreamingProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setTutorialData: React.Dispatch<React.SetStateAction<TutorialData | undefined>>;
  setEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useStreaming({
  messages,
  setMessages,
  setTutorialData,
  setEditorOpen,
  setEditorContent,
  setLoading
}: UseStreamingProps) {
  const [status, setStatus] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, sessionId: string, tutorialData?: TutorialData) => {
    if (!content.trim() || !sessionId) return;
    const userMessage: Message = {
      id: generateId(),
      author: 'USER',
      content,
      timestamp: getCurrentTimestamp(),
      tutorialData
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: generateId(),
      author: 'ASSISTANT',
      content: '',
      timestamp: getCurrentTimestamp(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Send to the enhanced messages endpoint
      const response = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          processWithAgent: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let finalTutorialData: TutorialData | undefined ;

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamingChunk = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'text-delta':
                  if (data.textDelta) {
                    accumulatedContent += data.textDelta;
                    // Update the assistant message content in real-time
                    setMessages(prev => {
                      const updated = prev.map(msg =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      );
                      return updated;
                    });
                  }
                  break;

                case 'status':
                  if (data.message) {
                    setStatus(data.message);

                    // Update the assistant message to show the status
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === assistantMessage.id
                          ? {
                            ...msg,
                            content: accumulatedContent + (accumulatedContent ? '\n\n' : '') + `🔄 ${data.message}`
                          }
                          : msg
                      )
                    );
                  }
                  break;

                case 'tutorial-data':
                  if (data.tutorialData) {
                    finalTutorialData = data.tutorialData;
                  }
                  break;

                case 'error':
                  throw new Error(data.error || 'Unknown error occurred');

                case 'finish':
                  // Stream completed successfully
                  setStatus(null); // Clear status when stream finishes
                  // Remove any status message from the final content
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                  break;
              }
            } catch (error) {
              console.error('Failed to parse line:', line, error);
              // Fallback: treat unparseable content as text
              if (line.startsWith('data: ')) {
                const rawContent = line.slice(6);
                accumulatedContent += rawContent;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }
            }
          }
        }
      }

      // Update tutorial data if present
      if (finalTutorialData) {
        setTutorialData(finalTutorialData);

        // Add tutorial data to the assistant message
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? {
                ...msg,
                tutorialData: finalTutorialData
              }
              : msg
          )
        );

        // Auto-open editor for tutorial steps with code
        setEditorOpen(true);
        setEditorContent(finalTutorialData.tutorialStep?.codeContent || '');
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Update the assistant message with error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessage.id
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }, [messages, setMessages, setTutorialData, setEditorOpen, setEditorContent, setLoading]);

  return {
    sendMessage,
    status,
    clearStatus: () => setStatus(null)
  };
}