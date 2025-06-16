// Node.js built-in modules
import { promises as fs } from 'fs';
import * as path from 'path';

import type { AgentContext } from '@agentuity/sdk';

import { processDoc } from './docs-processor';
import { VECTOR_STORE_NAME } from './config';

export const DEFAULT_CONTENT_DIR = path.resolve(__dirname, '../../../../content');

/**
 * Checks if a document has changed by comparing its hash.
 * @param docPath Absolute path to the .mdx file
 * @param newHash Newly computed hash
 * @returns true if changed, false if unchanged
 */
export async function hasDocChanged(ctx: AgentContext, docPath: string, newHash: string): Promise<boolean> {
    const vectors = await ctx.vector.search(VECTOR_STORE_NAME, {
        query: ' ',
        limit: 1,
        metadata: { path: docPath },
    });
    if (vectors.length > 0) {
        const storedHash = vectors[0]?.metadata?.hash;
        return storedHash !== newHash;
    }
    return true;
}

interface OrchestratorOptions {
    changedFiles: string[]; // Absolute file paths
    removedFiles: string[]; // Absolute file paths
    contentDir?: string;    // Defaults to /content
    dryRun?: boolean;       // For testing/logging only
    // ...other options (logging, concurrency, etc.)
}

interface SyncStats {
    processed: number;
    deleted: number;
    errors: number;
    errorFiles: string[];
}

/**
 * Helper to remove all vectors for a given relative path from the vector store.
 */
async function removeVectorsByRelativePath(ctx: AgentContext, relativePath: string, vectorStoreName: string) {
    ctx.logger.info('Removing vectors for path: %s, store: %s, metadata: %o', relativePath, vectorStoreName, {path: relativePath});
    const vectors = await ctx.vector.search(vectorStoreName, {
        query: ' ',
        limit: 1000,
        metadata: { path: relativePath },
    });
    if (vectors.length > 0) {
        // Delete vectors one by one to avoid issues with large batches
        for (const vector of vectors) {
            await ctx.vector.delete(vectorStoreName, vector.key);
        }
    } else {
        ctx.logger.info('No vectors found for path: %s, store: %s, metadata: %o', relativePath, vectorStoreName, {path: relativePath});
    }
}

export async function syncDocs(ctx: AgentContext, options: OrchestratorOptions): Promise<SyncStats> {
    const { changedFiles, removedFiles, dryRun } = options;
    const contentDir = options.contentDir || DEFAULT_CONTENT_DIR;
    let processed = 0, deleted = 0, errors = 0;
    const errorFiles: string[] = [];

    for (const absolutePath of changedFiles) {
        try {
            // Compute relative path for metadata and vector store
            const relativePath = path.relative(contentDir, absolutePath);
            await removeVectorsByRelativePath(ctx, relativePath, VECTOR_STORE_NAME);
            const content = await fs.readFile(absolutePath, 'utf-8');
            const chunks = await processDoc(content);
            for (const chunk of chunks) {
                chunk.metadata = {
                    ...chunk.metadata,
                    path: relativePath,
                };
                await ctx.vector.upsert(VECTOR_STORE_NAME, chunk);
            }
            processed++;
        } catch (err) {
            errors++;
            errorFiles.push(absolutePath);
            ctx.logger.error('Error processing file %s: %o', absolutePath, err);
        }
    }

    for (const absolutePath of removedFiles) {
        try {
            const relativePath = path.relative(contentDir, absolutePath);
            await removeVectorsByRelativePath(ctx, relativePath, VECTOR_STORE_NAME);
            deleted++;
        } catch (err) {
            errors++;
            errorFiles.push(absolutePath);
            ctx.logger.error('Error deleting file %s: %o', absolutePath, err);
        }
    }

    return { processed, deleted, errors, errorFiles };
} 