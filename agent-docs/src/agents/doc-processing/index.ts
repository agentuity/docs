import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { syncDocs } from './docs-orchestrator';
import fs from 'fs/promises';
import * as path from 'path';

const CONTENT_DIR =path.resolve(__dirname, '../../../../../content');

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
    // Parse JSON body for changedFiles and removedFiles
    const { changedFiles = [], removedFiles = [] } = await req.data.json() as any;
    if (!Array.isArray(changedFiles) || !Array.isArray(removedFiles)) {
      return resp.json({ error: 'changedFiles and removedFiles must be arrays.' }, 400);
    }
    console.log("changedFiles", changedFiles);
    console.log("removedFiles", removedFiles);

    // Call orchestrator
    const stats = await syncDocs(ctx, {
      changedFiles,
      removedFiles,
      contentDir: CONTENT_DIR
    });
    return resp.json({ status: 'ok', stats });
  } catch (error) {
    ctx.logger.error('Error running sync agent:', error);
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    return resp.json({ error: message }, 500);
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
  const docPaths = await getAllDocPaths(CONTENT_DIR+"/SDKs");
  const stats = await syncDocs(ctx, {
    changedFiles: docPaths,
    removedFiles: [],
    dryRun: false,
  });
  return stats;
}