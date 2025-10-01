// Tutorial state management exports
export * from './types';
export * from './state-manager';

// Tutorial configuration utilities
import { join } from 'path';
import { readFile } from 'fs/promises';

interface TutorialMeta {
  id: string;
  title: string;
  description: string;
  path: string;
  difficulty?: string;
  estimatedTime?: string;
}

interface TutorialsConfig {
  tutorials: TutorialMeta[];
}

/**
 * Reads the tutorials.json configuration file
 */
export async function getTutorialsConfig(): Promise<TutorialsConfig> {
  const configPath = join(process.cwd(), 'content', 'tutorials.json');
  const configContent = await readFile(configPath, 'utf-8');
  return JSON.parse(configContent);
}

/**
 * Gets the full file path for a specific tutorial based on tutorials.json
 */
export async function getTutorialFilePath(tutorialId: string): Promise<string | null> {
  const config = await getTutorialsConfig();
  const tutorial = config.tutorials.find(t => t.id === tutorialId);
  
  if (!tutorial) {
    return null;
  }
  
  return join(process.cwd(), 'content', tutorial.path);
}
