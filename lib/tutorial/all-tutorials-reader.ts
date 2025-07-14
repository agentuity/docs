import { readdir } from "fs/promises";
import { join } from "path";
import { readTutorial, type Tutorial } from "./tutorial-reader";

/**
 * Interface for all tutorials collection
 */
export interface AllTutorials {
  tutorials: TutorialWithPath[];
  totalTutorials: number;
}

/**
 * Tutorial with its path information
 */
export interface TutorialWithPath extends Tutorial {
  path: string;
  directoryName: string; // directory name for reference
}

/**
 * Reads all tutorials from a given base directory
 * Each tutorial should be in its own directory with a 'content' subdirectory
 */
export async function readAllTutorials(basePath: string): Promise<AllTutorials> {
  try {
    const entries = await readdir(basePath, { withFileTypes: true });
    const tutorialDirs = entries.filter(entry => entry.isDirectory());
    
    const tutorials: TutorialWithPath[] = [];
    
    for (const tutorialDir of tutorialDirs) {
      try {
        const tutorialPath = join(basePath, tutorialDir.name);
        const contentPath = join(tutorialPath, "content");
        
        // Check if content directory exists by trying to read it
        try {
          await readdir(contentPath);
        } catch {
          // Skip directories that don't have a content subdirectory
          continue;
        }
        
        // Read the tutorial using our tutorial reader
        const tutorial = await readTutorial(contentPath);
        
        tutorials.push({
          ...tutorial,
          path: tutorialPath,
          directoryName: tutorialDir.name
        });
        
      } catch (error) {
        console.warn(`Failed to read tutorial from ${tutorialDir.name}:`, error);
        // Continue with other tutorials even if one fails
      }
    }
    
    return {
      tutorials,
      totalTutorials: tutorials.length
    };
  } catch (error) {
    throw new Error(`Failed to read tutorials from ${basePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Reads a specific tutorial by ID
 */
export async function readTutorialById(basePath: string, tutorialId: string): Promise<TutorialWithPath | null> {
  try {
    const tutorialPath = join(basePath, tutorialId);
    const contentPath = join(tutorialPath, "content");
    
    const tutorial = await readTutorial(contentPath);
    
    return {
      ...tutorial,
      path: tutorialPath,
      directoryName: tutorialId
    };
  } catch (error) {
    console.warn(`Failed to read tutorial ${tutorialId}:`, error);
    return null;
  }
}

 