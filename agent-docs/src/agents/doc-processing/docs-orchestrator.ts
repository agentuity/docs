import { promises as fs } from 'fs';
import { processDoc } from './docs-processor';
import type { AgentContext } from '@agentuity/sdk';
import { createHash } from 'crypto';
import * as path from 'path';
// import vector store SDK or context as needed

const vectorStoreName = 'docs';
export const DEFAULT_CONTENT_DIR = path.resolve(__dirname, '../../../../content');

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
        limit: 10,
        metadata: { path: docPath },
    });
    if (vectors.length > 0) {
        const storedHash = vectors[0]?.metadata?.hash;
        return storedHash !== newHash;
    }
    return true;
}

interface OrchestratorOptions {
    changedFiles: string[]; // Relative paths from contentDir
    removedFiles: string[]; // Relative paths from contentDir
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
    const vectors = await ctx.vector.search(vectorStoreName, {
        query: '',
        limit: 1000,
        metadata: { path: relativePath },
    });
    const ids = vectors.map(vector => vector.id);
    if (ids.length > 0) {
        await ctx.vector.delete(vectorStoreName, ...ids);
    }
}

export async function syncDocs(ctx: AgentContext, options: OrchestratorOptions): Promise<SyncStats> {
    const { changedFiles, removedFiles, dryRun } = options;
    const contentDir = options.contentDir || DEFAULT_CONTENT_DIR;
    let processed = 0, deleted = 0, errors = 0;
    const errorFiles: string[] = [];

    for (const relativePath of changedFiles) {
        try {
            await removeVectorsByRelativePath(ctx, relativePath, vectorStoreName);
            const absolutePath = path.join(contentDir, relativePath);
            const content = await fs.readFile(absolutePath, 'utf-8');
            const chunks = await processDoc(content);
            for (const chunk of chunks) {
                chunk.metadata = {
                    ...chunk.metadata,
                    path: relativePath,
                };
                await ctx.vector.upsert(vectorStoreName, chunk);
            }
            processed++;
        } catch (err) {
            errors++;
            errorFiles.push(relativePath);
            ctx.logger.error('Error processing file %s: %o', relativePath, err);
        }
    }

    for (const relativePath of removedFiles) {
        try {
            await removeVectorsByRelativePath(ctx, relativePath, vectorStoreName);
            deleted++;
        } catch (err) {
            errors++;
            errorFiles.push(relativePath);
            ctx.logger.error('Error deleting file %s: %o', relativePath, err);
        }
    }

    return { processed, deleted, errors, errorFiles };
} 