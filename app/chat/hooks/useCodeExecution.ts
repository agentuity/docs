import { useState, useCallback } from 'react';
import { ChatMessage, ExecutionResult } from '../types';

interface UseCodeExecutionProps {
  currentSessionId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setExecutionResult: React.Dispatch<React.SetStateAction<string | null>>;
  setServerRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useCodeExecution({
  currentSessionId,
  messages,
  setMessages,
  setExecutionResult,
  setServerRunning
}: UseCodeExecutionProps) {
  const [serverStopping, setServerStopping] = useState(false);
  const [executingFiles, setExecutingFiles] = useState<Set<string>>(new Set());

  // Check server status
  const checkServerStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/execute?sessionId=${currentSessionId}`);
      const data = await response.json();
      setServerRunning(data.running || false);
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerRunning(false);
    }
  }, [currentSessionId, setServerRunning]);

  // Stop server
  const stopServer = useCallback(async () => {
    if (serverStopping) return;

    setServerStopping(true);
    try {
      const response = await fetch(`/api/execute?sessionId=${currentSessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setServerRunning(false);
        setExecutionResult(prev => prev + '\n\n🛑 Server stopped by user');
      } else {
        const error = await response.json();
        setExecutionResult(prev => prev + `\n\n❌ Failed to stop server: ${error.message}`);
      }
    } catch (error) {
      console.error('Error stopping server:', error);
      setExecutionResult(prev => prev + '\n\n❌ Error stopping server');
    } finally {
      setServerStopping(false);
    }
  }, [currentSessionId, setServerRunning, setExecutionResult, serverStopping]);

  // Run code in the editor
  const runCode = useCallback(async (editorContent: string) => {
    setExecutionResult('Running code...');
    setServerRunning(true);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: editorContent,
          filename: 'editor.ts',
          sessionId: currentSessionId,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute code');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let outputBuffer = '';
      let errorBuffer = '';

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
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'status':
                  setExecutionResult(data.message);
                  break;
                case 'stdout':
                  outputBuffer += data.data;
                  setExecutionResult(`Output:\n${outputBuffer}`);
                  break;
                case 'stderr':
                  errorBuffer += data.data;
                  setExecutionResult(`Error:\n${errorBuffer}`);
                  break;
                case 'close':
                  setServerRunning(false);
                  if (data.exitCode === 0) {
                    setExecutionResult(`Output:\n${outputBuffer || '(no output)'}`);
                  } else {
                    setExecutionResult(`Process exited with code ${data.exitCode}\nError:\n${errorBuffer}`);
                  }
                  break;
                case 'timeout':
                  setServerRunning(false);
                  setExecutionResult(prev => `${prev}\n\n🕐 ${data.message}`);
                  break;
                case 'error':
                  setServerRunning(false);
                  setExecutionResult(`Error:\n${data.error}`);
                  break;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setServerRunning(false);
      setExecutionResult('Connection error - please try again');
    }
  }, [currentSessionId, setServerRunning, setExecutionResult]);

  // Execute code from a message
  const executeCode = useCallback(async (code: string, filename: string) => {
    setExecutingFiles(prev => new Set(prev).add(filename));

    // Determine if this is a tutorial execution
    const isTutorialCode = filename === 'index.ts' && code.includes('@agentuity/sdk');
    const tutorialId = isTutorialCode ? 'typescript-sdk' : undefined;
    const stepId = isTutorialCode ? 1 : undefined; // For now, default to step 1

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          filename,
          sessionId: currentSessionId,
          tutorialId,
          stepId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute code');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let outputBuffer = '';
      let errorBuffer = '';
      let currentResult: ExecutionResult = { output: '', error: undefined, executionTime: 0, exitCode: 0 };

      if (!reader) {
        throw new Error('No response body');
      }

      // Update UI immediately to show execution started
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.codeBlock?.filename === filename) {
            return {
              ...msg,
              execution: {
                output: 'Starting execution...',
                executionTime: 0,
                exitCode: 0
              }
            };
          }
          return msg;
        })
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'status':
                  currentResult.output = data.message;
                  break;
                case 'stdout':
                  outputBuffer += data.data;
                  currentResult.output = outputBuffer;
                  break;
                case 'stderr':
                  errorBuffer += data.data;
                  currentResult.error = errorBuffer;
                  break;
                case 'close':
                  currentResult.exitCode = data.exitCode || 0;
                  currentResult.output = outputBuffer || '(no output)';
                  if (errorBuffer) {
                    currentResult.error = errorBuffer;
                  }
                  break;
                case 'timeout':
                  currentResult.error = data.message;
                  currentResult.exitCode = 1;
                  break;
                case 'error':
                  currentResult.error = data.error;
                  currentResult.exitCode = 1;
                  break;
              }

              // Update the message with current execution results
              setMessages(prevMessages =>
                prevMessages.map(msg => {
                  if (msg.codeBlock?.filename === filename) {
                    return {
                      ...msg,
                      execution: { ...currentResult }
                    };
                  }
                  return msg;
                })
              );
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error executing code:', error);

      // Update with error state
      setMessages(prevMessages =>
        prevMessages.map(msg => {
          if (msg.codeBlock?.filename === filename) {
            return {
              ...msg,
              execution: {
                output: '',
                error: 'Connection error - please try again',
                executionTime: 0,
                exitCode: 1
              }
            };
          }
          return msg;
        })
      );
    } finally {
      setExecutingFiles(prev => {
        const newFiles = new Set(prev);
        newFiles.delete(filename);
        return newFiles;
      });
    }
  }, [currentSessionId, setMessages]);

  // Handle code changes in messages
  const handleCodeChange = useCallback((code: string, filename: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.codeBlock?.filename === filename) {
          return {
            ...msg,
            codeBlock: { ...msg.codeBlock, content: code },
            execution: undefined // Clear previous execution results
          };
        }
        return msg;
      })
    );
  }, [setMessages]);

  return {
    serverStopping,
    executingFiles,
    checkServerStatus,
    stopServer,
    runCode,
    executeCode,
    handleCodeChange
  };
} 