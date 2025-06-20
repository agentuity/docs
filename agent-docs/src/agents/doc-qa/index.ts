import type { AgentContext, AgentRequest, AgentResponse } from '@agentuity/sdk';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

import type { ChunkMetadata } from '../doc-processing/types';
import { VECTOR_STORE_NAME, vectorSearchNumber } from '../../../../config';
import type { RelevantDoc } from './types';

export default async function Agent(
  req: AgentRequest,
  resp: AgentResponse,
  ctx: AgentContext
) {
  const prompt = await req.data.text();
  const relevantDocs = await retrieveRelevantDocs(ctx, prompt);

  const systemPrompt = `
You are a developer documentation assistant. Your job is to answer user questions about the Agentuity platform as effectively and concisely as possible, adapting your style to the user's request. If the user asks for a direct answer, provide it without extra explanation. If they want an explanation, provide a clear and concise one. Use only the provided relevant documents to answer.

You must not make up answers if the provided documents don't exist. You can be direct to the user that the documentations
don't seem to include what they are looking for. Lying to the user is prohibited as it only slows them down. Feel free to
suggest follow up questions if what they're asking for don't seem to have an answer in the document. You can provide them
a few related things that the documents contain that may interest them.

For every answer, return a valid JSON object with:
  1. "answer": your answer to the user's question.
  2. "documents": an array of strings, representing the path of the documents you used to answer.

If you use information from a document, include it in the "documents" array. If you do not use any documents, return an empty array for "documents".

User question:
\`\`\`
${prompt}
\`\`\`

Relevant documents:
${JSON.stringify(relevantDocs, null, 2)}

Respond ONLY with a valid JSON object as described above. In your answer, you should format code blocks properly in Markdown style if the user needs answer in code block.
`.trim();

  const llmResponse = await streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    prompt: prompt,
    maxTokens: 2048,
  });

  return resp.stream(llmResponse.textStream);
}

async function retrieveRelevantDocs(ctx: AgentContext, prompt: string): Promise<RelevantDoc[]> {
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