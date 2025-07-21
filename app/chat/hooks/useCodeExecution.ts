import { useState, useCallback } from 'react';
import { ExecutionEvent } from '../types';
import { apiService } from '../services/api';

interface UseCodeExecutionOptions {
  sessionId: string;
  onExecutionStart?: () => void;
  onExecutionComplete?: (success: boolean) => void;
  onExecutionError?: (error: Error) => void;
}

interface UseCodeExecutionResult {
  executeCode: (code: string, filename: string, tutorialId?: string, stepId?: string) => Promise<void>;
  stopServer: () => Promise<void>;
  checkServerStatus: () => Promise<void>;
  executionResult: string | null;
  serverRunning: boolean;
  serverStopping: boolean;
}

export function useCodeExecution({
  sessionId,
  onExecutionStart,
  onExecutionComplete,
  onExecutionError
}: UseCodeExecutionOptions): UseCodeExecutionResult {
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [serverRunning, setServerRunning] = useState(false);
  const [serverStopping, setServerStopping] = useState(false);

  const checkServerStatus = useCallback(async () => {
    try {
      const data = await apiService.checkServerStatus(sessionId);
      setServerRunning(data.running || false);
      
      // You could add idle time display here if needed
      if (data.running && data.idleTimeMs) {
        const idleMinutes = Math.floor(data.idleTimeMs / 60000);
        const timeoutMinutes = Math.floor(data.timeoutMs / 60000);
        console.log(`Server idle for ${idleMinutes}/${timeoutMinutes} minutes`);
      }
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerRunning(false);
    }
  }, [sessionId]);

  const stopServer = useCallback(async () => {
    if (!serverRunning || serverStopping) return;
    
    setServerStopping(true);
    try {
      await apiService.stopServer(sessionId);
      setServerRunning(false);
      setExecutionResult(prev => prev + '\n\n🛑 Server stopped by user');
    } catch (error) {
      console.error('Error stopping server:', error);
      if (error instanceof Error) {
        setExecutionResult(prev => prev + `\n\n❌ ${error.message}`);
      } else {
        setExecutionResult(prev => prev + '\n\n❌ Error stopping server');
      }
    } finally {
      setServerStopping(false);
    }
  }, [serverRunning, serverStopping, sessionId]);

  const executeCode = useCallback(async (
    code: string, 
    filename: string,
    tutorialId?: string,
    stepId?: string
  ) => {
    if (onExecutionStart) {
      onExecutionStart();
    }
    
    setExecutionResult('Running code...');
    setServerRunning(true);
    
    try {
      const stream = await apiService.executeCode({
        code,
        filename,
        sessionId,
        tutorialId,
        stepId: stepId?.toString()
      });
      
      // Handle streaming response
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let outputBuffer = '';
      let errorBuffer = '';
      let success = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as ExecutionEvent;
              
              switch (data.type) {
                case 'status':
                  setExecutionResult(data.message || 'Running code...');
                  break;
                case 'stdout':
                  if (data.data) {
                    outputBuffer += data.data;
                    setExecutionResult(`Output:\n${outputBuffer}`);
                  }
                  break;
                case 'stderr':
                  if (data.data) {
                    errorBuffer += data.data;
                    setExecutionResult(`Error:\n${errorBuffer}`);
                  }
                  break;
                case 'close':
                  setServerRunning(false);
                  if (data.exitCode === 0) {
                    setExecutionResult(`Output:\n${outputBuffer || '(no output)'}`);
                    success = true;
                  } else {
                    setExecutionResult(`Process exited with code ${data.exitCode}\nError:\n${errorBuffer}`);
                  }
                  break;
                case 'timeout':
                  setServerRunning(false);
                  setExecutionResult(prev => `${prev || ''}\n\n🕐 ${data.message || 'Server timed out due to inactivity'}`);
                  break;
                case 'error':
                  setServerRunning(false);
                  setExecutionResult(`Error:\n${data.error || 'Unknown error occurred'}`);
                  break;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

      if (onExecutionComplete) {
        onExecutionComplete(success);
      }
    } catch (error) {
      console.error('Error executing code:', error);
      setServerRunning(false);
      setExecutionResult('Connection error - please try again');
      
      if (onExecutionError && error instanceof Error) {
        onExecutionError(error);
      }
    }
  }, [sessionId, onExecutionStart, onExecutionComplete, onExecutionError]);

  return {
    executeCode,
    stopServer,
    checkServerStatus,
    executionResult,
    serverRunning,
    serverStopping
  };
} 