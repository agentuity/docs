import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { parseTutorialMDXCached } from '@/lib/tutorial/mdx-parser';
import { TutorialListItemSchema, type TutorialListItem } from '@/lib/tutorial/schemas';

export async function GET() {
  try {
    const tutorialsDir = join(process.cwd(), 'content', 'Tutorial');
    
    // Check if Tutorial directory exists, if not create it for future use
    let entries: string[];
    try {
      entries = await readdir(tutorialsDir);
    } catch (error) {
      // Return empty array if Tutorial directory doesn't exist yet
      return NextResponse.json([]);
    }
    
    const mdxFiles = entries.filter(file => file.endsWith('.mdx'));
    
    const tutorials = await Promise.all(
      mdxFiles.map(async (file): Promise<TutorialListItem | null> => {
        try {
          const filePath = join(tutorialsDir, file);
          const parsed = await parseTutorialMDXCached(filePath);
          
          const tutorialItem = {
            id: file.replace('.mdx', ''),
            title: parsed.metadata.title,
            description: parsed.metadata.description,
            totalSteps: parsed.metadata.totalSteps,
            difficulty: parsed.metadata.difficulty,
            estimatedTime: parsed.metadata.estimatedTime,
          };

          // Validate the tutorial list item
          const validationResult = TutorialListItemSchema.safeParse(tutorialItem);
          if (!validationResult.success) {
            console.warn(`Invalid tutorial item ${file}:`, validationResult.error.message);
            return null;
          }

          return validationResult.data;
        } catch (error) {
          console.warn(`Failed to parse tutorial ${file}:`, error);
          return null;
        }
      })
    );
    
    // Filter out failed tutorials
    const validTutorials = tutorials.filter(tutorial => tutorial !== null);
    
    return NextResponse.json(validTutorials);
  } catch (error) {
    console.error('Failed to load tutorials:', error);
    return NextResponse.json(
      { error: 'Failed to load tutorials' },
      { status: 500 }
    );
  }
}
