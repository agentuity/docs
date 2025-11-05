import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';

export interface ExecutionResult {
  success: boolean;
  output: string[];
  error?: string;
  responseData?: any;
}

/**
 * SandboxExecutor - Executes agent code in isolated Bun child processes
 *
 * This approach provides:
 * - Native TypeScript support (Bun transpiles automatically)
 * - Real import/export support (files are on disk)
 * - Process-level isolation (separate OS process)
 * - Resource limits (timeout, cleanup)
 */
export class SandboxExecutor {
  private readonly baseDir = '/tmp/sandbox';
  private readonly timeout = 10000; // 10 seconds

  /**
   * Execute agent code in a sandboxed Bun process
   *
   * @param code - The agent code to execute (with TypeScript, imports, etc.)
   * @returns ExecutionResult with output, errors, and response data
   */
  async execute(code: string): Promise<ExecutionResult> {
    const runId = randomUUID();
    const workspace = join(this.baseDir, runId);

    console.log('[SandboxExecutor] Starting execution', { runId, workspace });
    console.log('[SandboxExecutor] Code to execute (first 200 chars):', code.substring(0, 200));

    try {
      // 1. Create workspace
      await mkdir(workspace, { recursive: true });
      console.log('[SandboxExecutor] Workspace created');

      // 2. Write agent code
      await writeFile(join(workspace, 'agent.ts'), code);
      console.log('[SandboxExecutor] Agent code written');
      console.log('[SandboxExecutor] Code has export default:', code.includes('export default'));

      // 3. Write mock SDK
      await this.writeMockSDK(workspace);
      console.log('[SandboxExecutor] Mock SDK written');

      // 4. Write wrapper
      await this.writeWrapper(workspace);
      console.log('[SandboxExecutor] Wrapper written');

      // 5. Spawn Bun process
      const result = await this.spawnBunProcess(workspace);
      console.log('[SandboxExecutor] Execution completed', {
        success: result.success,
        outputLines: result.output.length
      });

      return result;

    } catch (error) {
      console.error('[SandboxExecutor] Execution failed', error);
      return {
        success: false,
        output: [],
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      // 6. Cleanup (always runs)
      try {
        await rm(workspace, { recursive: true, force: true });
        console.log('[SandboxExecutor] Workspace cleaned up');
      } catch (cleanupError) {
        console.error('[SandboxExecutor] Cleanup failed', cleanupError);
      }
    }
  }

  /**
   * Write minimal mock SDK to workspace
   * Provides mock implementations of AgentRequest, AgentResponse, AgentContext
   */
  private async writeMockSDK(workspace: string) {
    const mockSDKCode = `
// Minimal Mock SDK for Tutorial Sandbox
// Provides just enough to run Module 1-2 examples

export function createMockSDK() {
  return {
    // Mock AgentRequest
    request: {
      trigger: 'api',
      data: {
        json: async () => ({
          name: 'Test User',
          task: 'normal'
        }),
        text: async () => 'test data',
        contentType: 'application/json',
      }
    },

    // Mock AgentResponse
    response: {
      json: (data: any) => {
        console.log('__RESPONSE__', JSON.stringify(data));
        return data;
      }
    },

    // Mock AgentContext
    context: {
      agent: {
        id: 'sandbox-agent',
        name: 'Sandbox Agent'
      },
      sessionId: 'sandbox-session-123',
      logger: {
        info: (...args: any[]) => {
          const formatted = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          console.log('📘 INFO:', formatted);
        },
        warn: (...args: any[]) => {
          const formatted = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          console.log('⚠️  WARN:', formatted);
        },
        error: (...args: any[]) => {
          const formatted = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          console.log('❌ ERROR:', formatted);
        },
        debug: (...args: any[]) => {
          const formatted = args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          ).join(' ');
          console.log('🔍 DEBUG:', formatted);
        },
      }
    }
  };
}
`;
    await writeFile(join(workspace, 'mock-sdk.ts'), mockSDKCode);
  }

  /**
   * Write wrapper script that imports agent and executes it with mocks
   */
  private async writeWrapper(workspace: string) {
    const wrapperCode = `
// Wrapper script that executes the agent with mock SDK
import { createMockSDK } from './mock-sdk.ts';

// Dynamic import to handle both default and named exports
const agentModule = await import('./agent.ts');
const Agent = agentModule.default || agentModule.Agent || agentModule;

if (typeof Agent !== 'function') {
  console.error('ERROR: Agent is not a function. Got:', typeof Agent);
  process.exit(1);
}

const { request, response, context } = createMockSDK();

try {
  const result = await Agent(request, response, context);
  console.log('__EXECUTION_SUCCESS__');
} catch (error: any) {
  console.log('__EXECUTION_ERROR__', error.message);
  console.error(error.stack);
  process.exit(1);
}
`;
    await writeFile(join(workspace, 'wrapper.ts'), wrapperCode);
  }

  /**
   * Spawn Bun child process to execute the wrapper
   */
  private async spawnBunProcess(workspace: string): Promise<ExecutionResult> {
    console.log('[SandboxExecutor] Spawning Bun process...');

    return new Promise((resolve) => {
      const proc: ChildProcess = spawn('bun', ['run', join(workspace, 'wrapper.ts')], {
        cwd: workspace,
        env: process.env,
      });

      let stdout = '';
      let stderr = '';
      let killed = false;

      // Capture stdout
      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Capture stderr
      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        console.log('[SandboxExecutor] Process timeout, killing...');
        killed = true;
        proc.kill();
      }, this.timeout);

      // Handle process exit
      proc.on('close', (exitCode: number | null) => {
        clearTimeout(timeoutId);

        if (killed) {
          console.log('[SandboxExecutor] Process was killed due to timeout');
          resolve({
            success: false,
            output: [],
            error: 'Execution timeout (10s limit exceeded)',
          });
          return;
        }

        console.log('[SandboxExecutor] Process completed', { exitCode });
        resolve(this.parseOutput(stdout, stderr, exitCode || 0));
      });

      // Handle process error
      proc.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        console.error('[SandboxExecutor] Process error', error);
        resolve({
          success: false,
          output: [],
          error: `Failed to spawn process: ${error.message}`,
        });
      });
    });
  }

  /**
   * Parse stdout/stderr from Bun process
   * Looks for special markers:
   * - __EXECUTION_SUCCESS__ - Agent completed successfully
   * - __EXECUTION_ERROR__ - Agent threw an error
   * - __RESPONSE__ - Agent returned data via response.json()
   */
  private parseOutput(stdout: string, stderr: string, exitCode: number): ExecutionResult {
    const lines = stdout.split('\n').filter(line => line.trim());
    const output: string[] = [];
    let responseData: any = null;
    let hasError = false;
    let errorMessage = '';

    for (const line of lines) {
      if (line.includes('__EXECUTION_SUCCESS__')) {
        // Success marker, don't add to output
        continue;
      } else if (line.includes('__EXECUTION_ERROR__')) {
        hasError = true;
        errorMessage = line.replace('__EXECUTION_ERROR__', '').trim();
      } else if (line.includes('__RESPONSE__')) {
        // Extract response data
        const jsonStr = line.replace('__RESPONSE__', '').trim();
        try {
          responseData = JSON.parse(jsonStr);
          output.push(''); // Add blank line before response
          output.push('📤 Response:');
          output.push(JSON.stringify(responseData, null, 2));
        } catch (e) {
          // If parse fails, just show raw
          output.push(jsonStr);
        }
      } else {
        output.push(line);
      }
    }

    // Add stderr if present
    if (stderr.trim()) {
      output.push('');
      output.push('--- Errors ---');
      output.push(stderr);
    }

    return {
      success: !hasError && exitCode === 0,
      output,
      error: hasError ? errorMessage : undefined,
      responseData,
    };
  }
}
