import type { AgentContext } from '@agentuity/sdk';
import { processDoc } from './docs-processor';
import { VECTOR_STORE_NAME } from './config';

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

interface SyncStats {
  processed: number;
  deleted: number;
  errors: number;
  errorFiles: string[];
}

/**
 * Helper to remove all vectors for a given logical path from the vector store.
 */
async function removeVectorsByPath(ctx: AgentContext, logicalPath: string, vectorStoreName: string) {
  ctx.logger.info('Removing vectors for path: %s', logicalPath);
  const vectors = await ctx.vector.search(vectorStoreName, {
    query: ' ',
    limit: 1000,
    metadata: { path: logicalPath },
  });
  
  if (vectors.length > 0) {
    // Delete vectors one by one to avoid issues with large batches
    for (const vector of vectors) {
      await ctx.vector.delete(vectorStoreName, vector.key);
    }
    ctx.logger.info('Removed %d vectors for path: %s', vectors.length, logicalPath);
  } else {
    ctx.logger.info('No vectors found for path: %s', logicalPath);
  }
}

/**
 * Process documentation sync from embedded payload - completely filesystem-free
 */
export async function syncDocsFromPayload(ctx: AgentContext, payload: SyncPayload): Promise<SyncStats> {
  const { changed, removed } = payload;
  let processed = 0, deleted = 0, errors = 0;
  const errorFiles: string[] = [];

  // Process changed files with embedded content
  for (const file of changed) {
    try {
      const { path: logicalPath, content: base64Content } = file;
      
      // Base64-decode the content
      const content = Buffer.from(base64Content, 'base64').toString('utf-8');
      
      // Remove existing vectors for this path
      await removeVectorsByPath(ctx, logicalPath, VECTOR_STORE_NAME);
      
      // Process the document content into chunks
      const chunks = await processDoc(content);
      
      // Upsert chunks with path metadata
      for (const chunk of chunks) {
        chunk.metadata = {
          ...chunk.metadata,
          path: logicalPath,
        };
        await ctx.vector.upsert(VECTOR_STORE_NAME, chunk);
      }
      
      processed++;
      ctx.logger.info('Successfully processed file: %s (%d chunks)', logicalPath, chunks.length);
    } catch (err) {
      errors++;
      errorFiles.push(file.path);
      ctx.logger.error('Error processing file %s: %o', file.path, err);
    }
  }

  // Process removed files
  for (const logicalPath of removed) {
    try {
      await removeVectorsByPath(ctx, logicalPath, VECTOR_STORE_NAME);
      deleted++;
      ctx.logger.info('Successfully removed file: %s', logicalPath);
    } catch (err) {
      errors++;
      errorFiles.push(logicalPath);
      ctx.logger.error('Error deleting file %s: %o', logicalPath, err);
    }
  }

  const stats = { processed, deleted, errors, errorFiles };
  ctx.logger.info('Sync completed: %o', stats);
  return stats;
} 