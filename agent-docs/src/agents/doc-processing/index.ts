import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { syncDocs, DEFAULT_CONTENT_DIR } from './docs-orchestrator';
import fs from 'fs/promises';
import * as path from 'path';

export const welcome = () => {
  return {
    welcome:
      "Welcome to the Vercel AI SDK with OpenAI Agent! I can help you build AI-powered applications using Vercel's AI SDK with OpenAI models.",
    prompts: [
      {
        data: 'How do I implement streaming responses with OpenAI models?',
        contentType: 'text/plain',
      },
      {
        data: 'What are the best practices for prompt engineering with OpenAI?',
        contentType: 'text/plain',
      },
    ],
  };
};

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const stats = await loadAllDocs(ctx);
    return resp.text("Processed docs... "+JSON.stringify(stats));
  } catch (error) {
    ctx.logger.error('Error running agent:', error);

    return resp.text('Sorry, there was an error processing your request.');
  }
}

/**
 * Recursively finds all .mdx files in the given directory.
 * @param rootDir The root directory to search (e.g., '/content')
 * @returns Promise<string[]> Array of absolute file paths to .mdx files
 */
export async function getAllDocPaths(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllDocPaths(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function loadAllDocs(ctx: AgentContext) {
  const contentDir = path.resolve(__dirname, '../../../../../content');
  const docPaths = await getAllDocPaths(contentDir+"/SDKs");
  // const stats = await syncDocs(ctx, {
  //   changedFiles: docPaths,
  //   removedFiles: [],
  //   dryRun: false,
  // });
  return docPaths;
}