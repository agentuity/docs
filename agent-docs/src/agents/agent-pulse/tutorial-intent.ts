import type { AgentContext } from '@agentuity/sdk';
import type { TutorialIntent, ChatSession } from './types';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Zod schema for tutorial intent classification
const TutorialIntentSchema = z.object({
  type: z.enum(['select_tutorial', 'navigate', 'question', 'exit_tutorial', 'help']),
  tutorialId: z.string().optional(),
  direction: z.enum(['next', 'previous', 'specific']).optional(),
  step: z.number().optional(),
  content: z.string().optional(),
  confidence: z.number().min(0).max(1)
});

/**
 * Classifies user intent in tutorial sessions using LLM
 * Determines if user wants to select tutorial, navigate, ask questions, etc.
 */
export async function classifyTutorialIntent(
  userMessage: string, 
  session: ChatSession,
  availableTutorials: any[] = [],
  ctx: AgentContext
): Promise<TutorialIntent> {
  try {
    // Build context for the LLM
    const context = buildIntentContext(session, availableTutorials);
    ctx.logger.info('LLM context for intent classification: %s', context);
        
    const result = await generateObject({
      model: openai('gpt-4'),
      schema: TutorialIntentSchema,
      prompt: `You are helping classify user intent in a tutorial system. 

Context:
${context}

User message: "${userMessage}"

Classify the user's intent:

1. "select_tutorial" - User wants to select/start a specific tutorial
   - Match the user's request against the Available Tutorials list above
   - Use the EXACT "id" field from the tutorial list (e.g., "react_basics")
   - NEVER make up tutorial IDs - only use IDs that exist in the Available Tutorials
   - Match by tutorial title, description, or keywords
   - If no clear match, leave tutorialId empty
   
   Examples:
   - User says "React tutorial" → tutorialId: "react_basics" (if that ID exists)
   - User says "unknown tutorial" → tutorialId: undefined (no match found)
   
2. "navigate" - User wants to move through tutorial steps
   - Words like: next, previous, back, forward, step 3, go to step X
   - Set direction and step number if specific
   
3. "question" - User is asking a question about tutorial content
   - Questions about concepts, code, explanations
   - Set content to the question
   
4. "exit_tutorial" - User wants to leave tutorial mode
   - Words like: exit, quit, stop, back to chat, end tutorial
   
5. "help" - User needs help with the tutorial system
   - Words like: help, how does this work, what can I do

IMPORTANT: For select_tutorial, the tutorialId field must be the exact "id" value from the Available Tutorials list. Do not create new IDs.

Return your best classification with confidence score.`
    });

    ctx.logger.info('LLM classified intent: %s with confidence: %f', result.object.type, result.object.confidence);
    
    return result.object as TutorialIntent;
    
  } catch (error) {
    ctx.logger.error('Failed to classify tutorial intent: %s', error);
    
    // Fallback to simple keyword matching
    return fallbackIntentClassification(userMessage, availableTutorials, ctx);
  }
}

/**
 * Builds context string for LLM to understand current session state
 */
function buildIntentContext(session: ChatSession, availableTutorials: any[]): string {
  let context = `Session Type: ${session.sessionType}\n`;
  
  if (session.currentTutorial) {
    context += `Current Tutorial: ${session.currentTutorial.tutorialTitle || 'Unknown'}\n`;
    context += `Current Step: ${session.currentTutorial.currentStep}/${session.currentTutorial.totalSteps}\n`;
  } else {
    context += `No active tutorial\n`;
  }
  
  if (availableTutorials.length > 0) {
    context += `\nAvailable Tutorials:\n`;
    availableTutorials.forEach(tutorial => {
      context += `- ${tutorial.id}: ${tutorial.title} - ${tutorial.description || 'No description'}\n`;
    });
  } else {
    context += `\nNo available tutorials loaded\n`;
  }
  
  // Add recent message context
  const recentMessages = session.messages.slice(-3);
  if (recentMessages.length > 0) {
    context += `\nRecent conversation:\n`;
    recentMessages.forEach(msg => {
      context += `${msg.type}: ${msg.content.substring(0, 100)}\n`;
    });
  }
  
  return context;
}

/**
 * Fallback classification using simple keyword matching when LLM fails
 */
function fallbackIntentClassification(
  userMessage: string, 
  availableTutorials: any[], 
  ctx: AgentContext
): TutorialIntent {
  const message = userMessage.toLowerCase().trim();
  
  ctx.logger.warn('Using fallback intent classification for: %s', userMessage);
  
  // Navigation keywords
  if (message.includes('next') || message.includes('continue') || message.includes('forward')) {
    return { type: 'navigate', direction: 'next', confidence: 0.7 };
  }
  
  if (message.includes('previous') || message.includes('back') || message.includes('prev')) {
    return { type: 'navigate', direction: 'previous', confidence: 0.7 };
  }
  
  // Step navigation
  const stepMatch = message.match(/step\s+(\d+)|go\s+to\s+(\d+)/);
  if (stepMatch) {
    const stepStr = stepMatch[1] || stepMatch[2];
    if (stepStr) {
      const step = parseInt(stepStr);
      return { type: 'navigate', direction: 'specific', step, confidence: 0.8 };
    }
  }
  
  // Exit keywords
  if (message.includes('exit') || message.includes('quit') || message.includes('stop') || 
      message.includes('end') || message.includes('chat')) {
    return { type: 'exit_tutorial', confidence: 0.8 };
  }
  
  // Help keywords
  if (message.includes('help') || message.includes('how') || message.includes('what can')) {
    return { type: 'help', confidence: 0.7 };
  }
  
  // Tutorial selection - try to match with available tutorials
  ctx.logger.info('Fallback: trying to match "%s" against %d available tutorials', message, availableTutorials.length);
  
  if (availableTutorials.length === 0) {
    ctx.logger.warn('Fallback: No tutorials available for matching');
    return { 
      type: 'question', 
      content: userMessage, 
      confidence: 0.5 
    };
  }
  
  for (const tutorial of availableTutorials) {
    ctx.logger.info('Fallback: checking tutorial id="%s" title="%s"', tutorial.id, tutorial.title);
    
    // Try matching by title words
    const titleWords = tutorial.title.toLowerCase().split(' ');
    const titleMatch = titleWords.some((word: string) => 
      word.length > 3 && message.includes(word)
    );
    
    // Try matching by ID parts (e.g., "javascript_sdk" contains "javascript")
    const idWords = tutorial.id.toLowerCase().split(/[_-]/);
    const idMatch = idWords.some((word: string) => 
      word.length > 3 && message.includes(word)
    );
    
    if (titleMatch || idMatch) {
      ctx.logger.info('Fallback: matched tutorial "%s" (id: %s) via %s', 
        tutorial.title, tutorial.id, titleMatch ? 'title' : 'id');
      return { 
        type: 'select_tutorial', 
        tutorialId: tutorial.id,  // Use the exact ID from the tutorial
        confidence: titleMatch ? 0.7 : 0.6 
      };
    }
  }
  
  ctx.logger.info('Fallback: no tutorial matches found, defaulting to question intent');
  
  // Default to question if nothing else matches
  return { 
    type: 'question', 
    content: userMessage, 
    confidence: 0.5 
  };
} 