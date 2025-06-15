import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
/**
 * Generates embeddings for an array of texts using the OpenAI embedding API (via Vercel AI SDK).
 * @param texts Array of strings to embed.
 * @param model Embedding model to use (default: 'text-embedding-3-small').
 * @returns Promise<number[][]> Array of embedding vectors.
 */
export async function embedChunks(
  texts: string[],
  model: string = 'text-embedding-3-small'
): Promise<number[][]> {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('No texts provided for embedding.');
  }
  // Call the embedding API in batch
  const response = await embedMany({
    model: openai.embedding(model),
    values: texts
  })
  if (!response.embeddings || response.embeddings.length !== texts.length) {
    throw new Error('Embedding API returned unexpected result.');
  }
  return response.embeddings;
} 