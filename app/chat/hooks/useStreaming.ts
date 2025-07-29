import { useState, useCallback } from 'react';
import { ChatMessage, ConversationMessage, TutorialData, StreamingChunk, AgentStreamingRequest } from '../types';

// Agent endpoint
const AGENT_PULSE_URL = 'http://127.0.0.1:3500/agent_ddcb59aa4473f1323be5d9f5fb62b74e';

// Generate unique IDs
const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

interface UseStreamingProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setConversationHistory: React.Dispatch<React.SetStateAction<ConversationMessage[]>>;
  setTutorialData: React.Dispatch<React.SetStateAction<TutorialData | undefined>>;
  setEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditorContent: React.Dispatch<React.SetStateAction<string>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useStreaming({
  messages,
  setMessages,
  setConversationHistory,
  setTutorialData,
  setEditorOpen,
  setEditorContent,
  setLoading
}: UseStreamingProps) {
  const [status, setStatus] = useState<string | null>(null);

  // Helper to convert between message formats
  const convertToConversationMessage = useCallback((message: ChatMessage): ConversationMessage => ({
    role: message.type === 'user' ? 'user' : 'assistant',
    content: message.content
  }), []);

  const sendMessage = useCallback(async (content: string, tutorialData?: TutorialData) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Create assistant message placeholder for streaming
    const assistantMessage: ChatMessage = {
      id: generateId(),
      type: 'assistant',
      content: '', // Will be populated during streaming
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Convert the last few messages to the format expected by the agent
      const recentMessages = [...messages.slice(-10), userMessage].map(convertToConversationMessage);

      // Prepare request payload
      const requestPayload: AgentStreamingRequest = {
        message: content,
        conversationHistory: recentMessages,
        tutorialData: tutorialData
      };

      // Send request to agent-pulse with streaming support
      const response = await fetch(AGENT_PULSE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to send message to agent');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let finalTutorialData: TutorialData | null = null;

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
              console.log('Received streaming chunk:', data); // Debug log

              switch (data.type) {
                case 'text-delta':
                  if (data.textDelta) {
                    accumulatedContent += data.textDelta;
                    // Update the assistant message content in real-time
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  }
                  break;

                case 'status':
                  if (data.message) {
                    setStatus(data.message);
                    console.log('Status message received:', data.message); // Debug log

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
                    console.log('Tutorial data received:', data.tutorialData); // Debug log
                  }
                  break;

                case 'error':
                  console.error('Error chunk received:', data.error); // Debug log
                  throw new Error(data.error || 'Unknown error occurred');

                case 'finish':
                  console.log('Stream finished'); // Debug log
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
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

      // Update conversation history with the final messages
      const updatedConversationHistory: ConversationMessage[] = [
        ...recentMessages,
        { role: 'assistant' as const, content: accumulatedContent }
      ];
      setConversationHistory(updatedConversationHistory);

      // Update tutorial data if present
      if (finalTutorialData) {
        setTutorialData(finalTutorialData);

        // Add code block if tutorial step has code
        if (finalTutorialData.tutorialStep?.codeContent) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? {
                  ...msg,
                  codeBlock: {
                    content: finalTutorialData!.tutorialStep.codeContent!,
                    language: 'typescript',
                    filename: 'index.ts',
                    editable: true
                  }
                }
                : msg
            )
          );

          // Auto-open editor for tutorial steps with code
          setEditorOpen(true);
          setEditorContent(finalTutorialData.tutorialStep.codeContent);
        }
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
  }, [messages, convertToConversationMessage, setMessages, setConversationHistory, setTutorialData, setEditorOpen, setEditorContent, setLoading]);

  return {
    sendMessage,
    status,
    clearStatus: () => setStatus(null)
  };
} 