import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, filename, sessionId } = await request.json();

    // Simulate code execution with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, return a mock successful execution
    // Later this can be connected to a real code execution sandbox
    const result = {
      success: true,
      output: `// Code executed successfully!\n// File: ${filename}\n// Session: ${sessionId}\n\nconsole.log("Hello from ${filename}!");\n// Output: Hello from ${filename}!`,
      executionTime: Math.floor(Math.random() * 500) + 100, // Random execution time
      timestamp: new Date().toISOString(),
    };

    return Response.json(result);
  } catch (error) {
    console.error('Code execution error:', error);
    return Response.json(
      {
        success: false,
        error: 'Code execution failed. This is a placeholder - real sandbox execution will be implemented soon.',
        executionTime: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 