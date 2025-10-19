// Tutorial state management exports
export * from './types';
export * from './state-manager';

// Tutorial configuration utilities
import { join } from 'path';
import { readFile } from 'fs/promises';
import { resolveSecurePath } from '@/lib/utils/secure-path';

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
 * Gets the full file path for a specific tutorial based on tutorials.json.
 * Validates that the tutorial path doesn't escape the content directory.
 */
export async function getTutorialFilePath(tutorialId: string): Promise<string | null> {
  const config = await getTutorialsConfig();
  const tutorial = config.tutorials.find(t => t.id === tutorialId);
  
  if (!tutorial) {
    return null;
  }
  
  // Ensure the path is secure and doesn't escape the content directory
  const contentDir = join(process.cwd(), 'content');
  const tutorialPath = `/${tutorial.path}`;
  
  try {
    return resolveSecurePath(tutorialPath, {
      baseDir: contentDir,
      requireLeadingSlash: true
    });
  } catch (error) {
    console.error(`Security validation failed for tutorial ${tutorialId}:`, error);
    return null;
  }
}
