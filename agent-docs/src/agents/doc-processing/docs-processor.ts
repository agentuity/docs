import { promises as fs } from 'fs';
import * as path from 'path';
import { chunkAndEnrichDoc } from './chunk-mdx';
import { embedChunks } from './embed-chunks';
import type { Chunk } from './chunk-mdx';
import { createHash } from 'crypto';
import type { AgentContext } from '@agentuity/sdk';

const vectorStoreName = 'docs';

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

/**
 * Computes a SHA-256 hash of the given file content.
 * @param content File content as string
 * @returns Hex string of the hash
 */
export function computeFileHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Checks if a document has changed by comparing its hash.
 * @param docPath Absolute path to the .mdx file
 * @param newHash Newly computed hash
 * @returns true if changed, false if unchanged
 */
export async function hasDocChanged(ctx: AgentContext, docPath: string, newHash: string): Promise<boolean> {
  const vectors = await ctx.vector.search(vectorStoreName, {
    query: '',
    limit: 1000,
    metadata: { path: docPath },
  });
  if (vectors.length > 0) {
    const storedHash = vectors[0]?.metadata?.hash;
    return storedHash !== newHash;
  }
  return true;
}

/**
 * Processes a single .mdx doc: loads, chunks, and enriches each chunk with metadata.
 * If the doc has changed, it will be processed and uploaded to the vector store.
 * If the doc has not changed, it will be skipped.
 *
 * @param docPath Absolute path to the .mdx file
 * @param ctx AgentContext for vector store and context-dependent logic
 */
export async function processDoc(docPath: string, ctx: AgentContext): Promise<Chunk[]> {
  const fileContent = await fs.readFile(docPath, 'utf-8');
  const hash = computeFileHash(fileContent);
  const changed = await hasDocChanged(ctx, docPath, hash);
  if (!changed) {
    ctx.logger.info('Doc unchanged, skipping: %s', docPath);
    return [];
  }
  ctx.logger.info('Processing doc: %s', docPath);
  const chunks = await chunkAndEnrichDoc(docPath, fileContent, hash);
  const vectors = await createVectorEmbedding(chunks);

  // Delete old vectors for this doc (by path)
  try {
    const oldVectors = await ctx.vector.search(vectorStoreName, {
      query: '',
      limit: 1000,
      metadata: { path: docPath },
    });
    for (const v of oldVectors) {
      await ctx.vector.delete(vectorStoreName, v.id);
      ctx.logger.info('Deleted old vector: %s', v.id);
    }
  } catch (err) {
    ctx.logger.error('Error deleting old vectors for %s: %o', docPath, err);
  }

  // Upsert new vectors
  try {
    await ctx.vector.upsert(vectorStoreName, ...vectors);
    ctx.logger.info('Upserted %d vectors for doc: %s', vectors.length, docPath);
  } catch (err) {
    ctx.logger.error('Error upserting vectors for %s: %o', docPath, err);
  }

  return chunks;
}

async function createVectorEmbedding(chunks: Chunk[]) {
  const embeddings = await embedChunks(chunks.map(chunk => chunk.text));
  return chunks.map((chunk, index) => {
    const metadata: Record<string, any> = {
      path: chunk.path,
      chunkIndex: chunk.chunkIndex,
      contentType: chunk.contentType,
      heading: chunk.heading,
      breadcrumbs: chunk.breadcrumbs,
      hash: chunk.hash,
    };
    return {
      key: chunk.id,
      document: chunk.text,
      embeddings: embeddings[index],
      metadata,
    };
  });
}