import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";

// TypeScript Interfaces
export interface TutorialMetadata {
  id: string;
  title: string;
  description: string;
}

export interface StepMetadata {
  title: string;
  description: string;
}

export interface Step {
  stepNumber: number;
  title: string;
  description: string;
  directory: string;
  readmeContent: string;
  codeContent: string;
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  totalSteps: number;
  steps: Step[];
}

/**
 * Reads tutorial metadata from meta.json
 */
export async function readTutorialMetadata(contentPath: string): Promise<TutorialMetadata> {
  try {
    const metaPath = join(contentPath, "meta.json");
    const metaContent = await readFile(metaPath, "utf-8");
    const metadata = JSON.parse(metaContent) as TutorialMetadata;
    
    if (!metadata.id || !metadata.title || !metadata.description) {
      throw new Error("Invalid meta.json: missing id, title, or description");
    }
    
    return metadata;
  } catch (error) {
    throw new Error(`Failed to read tutorial metadata: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Reads all steps from step_* directories
 */
export async function readSteps(contentPath: string): Promise<Step[]> {
  try {
    const entries = await readdir(contentPath, { withFileTypes: true });
    const stepDirs = entries
      .filter(entry => entry.isDirectory() && entry.name.startsWith('step_'))
      .sort((a, b) => {
        const aNum = parseInt(a.name.replace('step_', ''), 10);
        const bNum = parseInt(b.name.replace('step_', ''), 10);
        return aNum - bNum;
      });
    
    const steps: Step[] = [];
    
    for (const stepDir of stepDirs) {
      const stepPath = join(contentPath, stepDir.name);
      const stepNumber = parseInt(stepDir.name.replace('step_', ''), 10);
      
      // Read README.md and parse front-matter
      const readmePath = join(stepPath, "README.md");
      const readmeContent = await readFile(readmePath, "utf-8");
      const { data: frontmatter, content } = matter(readmeContent);
      
      // Validate front-matter has required fields
      if (!frontmatter.title || !frontmatter.description) {
        throw new Error(`Invalid front-matter in ${stepDir.name}/README.md: missing title or description`);
      }
      
      // Read index.ts
      const codePath = join(stepPath, "index.ts");
      const codeContent = await readFile(codePath, "utf-8");
      
      steps.push({
        stepNumber,
        title: frontmatter.title,
        description: frontmatter.description,
        directory: stepDir.name,
        readmeContent: content, // Use content without frontmatter
        codeContent
      });
    }
    
    return steps;
  } catch (error) {
    throw new Error(`Failed to read steps: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Reads a complete tutorial from the given content path
 */
export async function readTutorial(contentPath: string): Promise<Tutorial> {
  try {
    const [metadata, steps] = await Promise.all([
      readTutorialMetadata(contentPath),
      readSteps(contentPath)
    ]);
    
    return {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      totalSteps: steps.length,
      steps
    };
  } catch (error) {
    throw new Error(`Failed to read tutorial: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Utility function to get step by number
 */
export function getStepByNumber(tutorial: Tutorial, stepNumber: number): Step | undefined {
  return tutorial.steps.find(step => step.stepNumber === stepNumber);
}

/**
 * Utility function to get next step
 */
export function getNextStep(tutorial: Tutorial, currentStepNumber: number): Step | undefined {
  return tutorial.steps.find(step => step.stepNumber === currentStepNumber + 1);
}

/**
 * Utility function to get previous step
 */
export function getPreviousStep(tutorial: Tutorial, currentStepNumber: number): Step | undefined {
  return tutorial.steps.find(step => step.stepNumber === currentStepNumber - 1);
} 