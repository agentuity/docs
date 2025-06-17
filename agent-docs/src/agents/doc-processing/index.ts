import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { syncDocsFromPayload } from './docs-orchestrator';

export const welcome = () => {
  return {
    welcome: "Documentation Sync Agent - Processes embedded MDX content from GitHub workflows",
    prompts: [
      {
        data: 'Sync documentation changes from GitHub',
        contentType: 'text/plain',
      },
    ],
  };
};

interface FilePayload {
  path: string;
  content: string; // base64-encoded
}

interface SyncPayload {
  commit?: string;
  repo?: string;
  changed: FilePayload[];
  removed: string[];
}

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  try {
    const payload = await req.data.json() as unknown as SyncPayload;
    
    // Validate new payload format - reject old formats
    if (!payload.changed || !payload.removed || !Array.isArray(payload.changed) || !Array.isArray(payload.removed)) {
      return resp.json({ 
        error: 'Invalid payload format. Expected {changed: FilePayload[], removed: string[]}' 
      }, 400);
    }

    // Validate changed files have required structure
    for (const file of payload.changed) {
      if (!file.path || !file.content || typeof file.path !== 'string' || typeof file.content !== 'string') {
        return resp.json({ 
          error: 'Invalid file format. Each changed file must have {path: string, content: string}' 
        }, 400);
      }
    }

    // Validate removed files are strings
    for (const file of payload.removed) {
      if (typeof file !== 'string') {
        return resp.json({ 
          error: 'Invalid removed file format. Each removed file must be a string path' 
        }, 400);
      }
    }

    ctx.logger.info('Processing payload: %d changed files, %d removed files', 
      payload.changed.length, payload.removed.length);
    
    const stats = await syncDocsFromPayload(ctx, payload);
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