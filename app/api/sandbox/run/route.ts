import { NextRequest, NextResponse } from 'next/server';
import { SandboxExecutor } from '@/lib/sandbox/executor';

/**
 * POST /api/sandbox/run
 *
 * Executes agent code in a sandboxed Bun child process.
 * Now supports TypeScript, imports, and full agent syntax!
 */
export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json();

    // Validate input
    if (!code || !language) {
      return NextResponse.json(
        { success: false, output: [], error: 'Missing code or language parameter' },
        { status: 400 }
      );
    }

    // Only support TypeScript/JavaScript
    if (!['typescript', 'javascript', 'ts', 'js'].includes(language)) {
      return NextResponse.json({
        success: false,
        output: [],
        error: `Language "${language}" not supported. Only TypeScript/JavaScript can be executed.`
      }, { status: 400 });
    }

    console.log('[sandbox/run] Executing code with Bun child process', {
      language,
      codeLength: code.length
    });

    // Execute using new Bun child process approach
    const executor = new SandboxExecutor();
    const result = await executor.execute(code);

    console.log('[sandbox/run] Execution completed', {
      success: result.success,
      outputLines: result.output.length
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('[sandbox/run] Execution failed', error);
    return NextResponse.json({
      success: false,
      output: [],
      error: 'Failed to execute code'
    }, { status: 500 });
  }
}
