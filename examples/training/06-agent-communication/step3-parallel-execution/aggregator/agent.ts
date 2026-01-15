import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      text: z.string(),
      targetLanguage: z.string().default('Spanish')
    }),
    output: z.object({
      original: z.string(),
      translation: z.object({
        language: z.string(),
        text: z.string()
      }),
      summary: z.object({
        text: z.string(),
        keyPoints: z.array(z.string())
      }),
      executionTime: z.string()
    })
  },
  metadata: {
    name: 'Content Processor',
    description: 'Processes text with parallel translation and summarization'
  },
  handler: async (c, input) => {
    const startTime = Date.now();
    c.logger.info('Starting parallel processing', {
      textLength: input.text.length,
      targetLanguage: input.targetLanguage
    });

    // Execute translation and summarization in parallel - much faster than sequential
    const [translation, summary] = await Promise.all([
      c.agent.translator.run({
        text: input.text,
        targetLanguage: input.targetLanguage
      }),
      c.agent.summarizer.run({
        text: input.text
      })
    ]);

    const executionTime = `${Date.now() - startTime}ms`;
    c.logger.info('Parallel processing complete', { executionTime });

    // Return combined results from both agents
    return {
      original: input.text,
      translation,
      summary,
      executionTime
    };
  }
});
