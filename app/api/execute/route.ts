import { NextRequest } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

interface ProcessInfo {
  process: ChildProcess;
  lastActivity: number;
  sessionId: string;
  controller?: ReadableStreamDefaultController;
  encoder?: TextEncoder;
}

// Track running processes by session ID with activity timestamps
const runningProcesses = new Map<string, ProcessInfo>();

// Idle timeout: 5 minutes = 300,000 milliseconds
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

// Check for idle processes every minute
const CLEANUP_INTERVAL_MS = 60 * 1000;

// Start cleanup interval when module loads
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval() {
  if (cleanupInterval) return; // Already running
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const toCleanup: string[] = [];
    
    for (const [sessionId, processInfo] of runningProcesses.entries()) {
      const idleTime = now - processInfo.lastActivity;
      
      if (idleTime > IDLE_TIMEOUT_MS) {
        console.log(`🕐 Auto-killing idle server for session ${sessionId} (idle for ${Math.round(idleTime / 1000)}s)`);
        
        // Send timeout message to client if possible
        if (processInfo.controller && processInfo.encoder) {
          try {
            processInfo.controller.enqueue(processInfo.encoder.encode(`data: ${JSON.stringify({
              type: 'timeout',
              message: `Server automatically stopped after ${Math.round(idleTime / 1000)} seconds of inactivity`,
              timestamp: new Date().toISOString()
            })}\n\n`));
          } catch (error) {
            console.warn('Failed to send timeout message:', error);
          }
        }
        
        // Kill the process
        if (!processInfo.process.killed) {
          processInfo.process.kill('SIGTERM');
          setTimeout(() => {
            if (!processInfo.process.killed) {
              processInfo.process.kill('SIGKILL');
            }
          }, 5000);
        }
        
        toCleanup.push(sessionId);
      }
    }
    
    // Remove cleaned up processes
    toCleanup.forEach(sessionId => runningProcesses.delete(sessionId));
    
    // Stop cleanup interval if no processes are running
    if (runningProcesses.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  }, CLEANUP_INTERVAL_MS);
}

function updateActivity(sessionId: string) {
  const processInfo = runningProcesses.get(sessionId);
  if (processInfo) {
    processInfo.lastActivity = Date.now();
  }
}

export async function POST(request: NextRequest) {
  const { code, filename, sessionId, tutorialId, stepId } = await request.json();

  if (!code) {
    return new Response('Missing code in request body', { status: 400 });
  }

  // Kill any existing process for this session
  if (sessionId && runningProcesses.has(sessionId)) {
    const existingInfo = runningProcesses.get(sessionId);
    if (existingInfo && !existingInfo.process.killed) {
      existingInfo.process.kill('SIGTERM');
      runningProcesses.delete(sessionId);
    }
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      executeWithStreaming(code, filename, sessionId, tutorialId, stepId, controller, encoder);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// New DELETE endpoint to stop running processes
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return Response.json({ error: 'Missing sessionId parameter' }, { status: 400 });
  }

  const processInfo = runningProcesses.get(sessionId);
  if (!processInfo || processInfo.process.killed) {
    return Response.json({ message: 'No running process found for this session' }, { status: 404 });
  }

  try {
    processInfo.process.kill('SIGTERM');
    runningProcesses.delete(sessionId);
    
    // Give it a moment to clean up, then force kill if needed
    setTimeout(() => {
      if (!processInfo.process.killed) {
        processInfo.process.kill('SIGKILL');
      }
    }, 5000);

    return Response.json({ message: 'Process stopped successfully' });
  } catch (error) {
    console.error('Error stopping process:', error);
    return Response.json({ error: 'Failed to stop process' }, { status: 500 });
  }
}

// New GET endpoint to check process status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return Response.json({ error: 'Missing sessionId parameter' }, { status: 400 });
  }

  const processInfo = runningProcesses.get(sessionId);
  const isRunning = processInfo && !processInfo.process.killed;
  
  let idleTime = 0;
  if (isRunning && processInfo) {
    idleTime = Date.now() - processInfo.lastActivity;
  }

  return Response.json({ 
    running: isRunning,
    pid: isRunning ? processInfo.process.pid : null,
    idleTimeMs: idleTime,
    timeoutMs: IDLE_TIMEOUT_MS
  });
}

async function executeWithStreaming(
  code: string, 
  filename: string | null, 
  sessionId: string | null, 
  tutorialId: string | null, 
  stepId: string | null,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  let tempFilePath: string | null = null;
  
  try {
    // Create a temporary filename for the code
    const tempFilename = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.ts`;
    const tutorialPath = join(process.cwd(), 'Tutorial');
    tempFilePath = join(tutorialPath, tempFilename);
    
    // Write the code to a temporary file in the Tutorial directory
    await writeFile(tempFilePath, code, 'utf8');
    
    // Send initial status
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'status',
      message: `Starting agentuity dev for ${tutorialId ? `tutorial ${tutorialId} step ${stepId}` : 'code'}`,
      timestamp: new Date().toISOString(),
      sessionId,
      tutorialId,
      stepId,
      filename: filename || tempFilename
    })}\n\n`));

    console.log(`📝 Starting agentuity dev for ${tutorialId ? `tutorial ${tutorialId} step ${stepId}` : 'code'}:`);
    console.log(code);

    // Execute using agentuity dev
    const child = spawn('agentuity', ['dev'], {
      cwd: tutorialPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Store the process for this session with activity tracking
    if (sessionId) {
      const processInfo: ProcessInfo = {
        process: child,
        lastActivity: Date.now(),
        sessionId,
        controller,
        encoder
      };
      runningProcesses.set(sessionId, processInfo);
      
      // Start cleanup interval if this is the first process
      startCleanupInterval();
    }
    
    // Stream stdout in real-time
    child.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Update activity timestamp
      if (sessionId) {
        updateActivity(sessionId);
      }
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'stdout',
        data: output,
        timestamp: new Date().toISOString()
      })}\n\n`));
    });
    
    // Stream stderr in real-time
    child.stderr.on('data', (data) => {
      const output = data.toString();
      
      // Update activity timestamp
      if (sessionId) {
        updateActivity(sessionId);
      }
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'stderr',
        data: output,
        timestamp: new Date().toISOString()
      })}\n\n`));
    });
    
    child.on('close', (exitCode) => {
      // Remove from running processes
      if (sessionId) {
        runningProcesses.delete(sessionId);
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'close',
        exitCode,
        message: `Process exited with code ${exitCode}`,
        timestamp: new Date().toISOString()
      })}\n\n`));
      
      // Clean up and close stream
      if (tempFilePath) {
        unlink(tempFilePath).catch(console.warn);
      }
      controller.close();
    });
    
    child.on('error', (error) => {
      // Remove from running processes
      if (sessionId) {
        runningProcesses.delete(sessionId);
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      })}\n\n`));
      
      // Clean up and close stream
      if (tempFilePath) {
        unlink(tempFilePath).catch(console.warn);
      }
      controller.close();
    });
    
  } catch (error) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'error',
      error: error instanceof Error ? error.message : 'Code execution failed',
      timestamp: new Date().toISOString()
    })}\n\n`));
    
    // Clean up temp file on error
    if (tempFilePath) {
      unlink(tempFilePath).catch(console.warn);
    }
    controller.close();
  }
} 