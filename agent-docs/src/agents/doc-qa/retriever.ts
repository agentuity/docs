import type { AgentContext } from '@agentuity/sdk';

import type { ChunkMetadata } from '../doc-processing/types';
import { VECTOR_STORE_NAME, vectorSearchNumber } from '../../../config';
import type { RelevantDoc } from './types';

export async function retrieveRelevantDocs(ctx: AgentContext, prompt: string): Promise<RelevantDoc[]> {
    const dbQuery = {
      query: prompt,
      limit: vectorSearchNumber
    }
    try {
      const vectors = await ctx.vector.search(VECTOR_STORE_NAME, dbQuery);
  
      const uniquePaths = new Set<string>();
  
      vectors.forEach(vec => {
        if (!vec.metadata) {
          ctx.logger.warn('Vector missing metadata');
          return;
        }
        const path = typeof vec.metadata.path === 'string' ? vec.metadata.path : undefined;
        if (!path) {
          ctx.logger.warn('Vector metadata path is not a string');
          return;
        }
        uniquePaths.add(path);
      });
  
      const docs = await Promise.all(
        Array.from(uniquePaths).map(async path => ({
          path,
          content: await retrieveDocumentBasedOnPath(ctx, path)
        }))
      );
  
      return docs;
    } catch (err) {
      ctx.logger.error('Error retrieving relevant docs: %o', err);
      return [];
    }
  }
  
  async function retrieveDocumentBasedOnPath(ctx: AgentContext, path: string): Promise<string> {
    const dbQuery = {
      query: ' ',
      limit: 10000,
      metadata: {
        path: path
      }
    }
    try {
      const vectors = await ctx.vector.search(VECTOR_STORE_NAME, dbQuery);
  
      // Sort vectors by chunk index and concatenate text
      const sortedVectors = vectors
        .map(vec => {
          const metadata = vec.metadata as ChunkMetadata;
          return {
            metadata,
            index: metadata.chunkIndex
          };
        })
        .sort((a, b) => a.index - b.index);
  
      const fullText = sortedVectors
        .map(vec => vec.metadata.text)
        .join('\n\n');
  
      return fullText;
    } catch (err) {
      ctx.logger.error('Error retrieving document by path %s: %o', path, err);
      return '';
    }
  }