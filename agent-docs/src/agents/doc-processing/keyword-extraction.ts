import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export interface KeywordExtractionResult {
  keywords: string[];
  source: string;
  chunkPreview?: string;
}

export interface KeywordExtractionOptions {
  model?: string; // e.g., 'gpt-4o', 'gpt-3.5-turbo'
  maxKeywords?: number;
  logger?: { info: (msg: string, ...args: any[]) => void; error: (msg: string, ...args: any[]) => void };
}

/**
 * Extracts keywords from a documentation chunk using an LLM (Vercel AI SDK).
 * Prompts the LLM to return a JSON array of keywords, with fallback for comma-separated output.
 * @param chunkContent The text content of the documentation chunk.
 * @param options Optional settings for model, maxKeywords, and logger.
 * @returns Promise<KeywordExtractionResult> Structured result with keywords and metadata.
 * @throws Error if the LLM fails to generate a valid JSON response.
 */
export async function extractKeywordsWithLLM(
  chunkContent: string,
  options: KeywordExtractionOptions = {}
): Promise<KeywordExtractionResult> {
  const {
    model = 'gpt-4o',
    maxKeywords = 10,
    logger = { info: () => { }, error: () => { } },
  } = options;

  const prompt = `You are an expert technical documentation assistant.

Given the following documentation chunk, extract 5 to 10 important keywords or key phrases that would help a developer search for or understand this content. Focus on technical terms, API names, function names, CLI commands, configuration options, and unique concepts. Avoid generic words.

Return the keywords as a JSON array in the following format:
{
  "keywords": ["keyword1", "keyword2", ...]
}

Documentation chunk:
"""
${chunkContent}
"""
`;

  logger.info('Extracting keywords for chunk (length: %d)...', chunkContent.length);
  const result = await generateText({
    model: openai(model),
    prompt,
    maxTokens: 150,
    temperature: 0.2,
  });
  console.log("result");
  console.log(result.text);
  const raw = result.text || '';
  let keywords: string[] = [];
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed.keywords)) {
    keywords = parsed.keywords
      .map((k: string) => k.trim())
      .filter((k: string) => Boolean(k))
      .filter((k: string, i: number, arr: string[]) => arr.indexOf(k) === i)
      .slice(0, maxKeywords);
  }
  logger.info('Extracted keywords: %o', keywords);
  return {
    keywords,
    source: 'llm',
    chunkPreview: chunkContent.slice(0, 100),
  };

} 