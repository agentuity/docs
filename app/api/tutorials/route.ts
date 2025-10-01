import { NextResponse } from 'next/server';
import { join } from 'path';
import { parseTutorialMDXCached } from '@/lib/tutorial/mdx-parser';
import { TutorialListItemSchema, type TutorialListItem } from '@/lib/tutorial/schemas';
import { getTutorialsConfig } from '@/lib/tutorial';

export async function GET() {
  try {
    const config = await getTutorialsConfig();

    const tutorials = await Promise.all(
      config.tutorials.map(async (tutorialMeta): Promise<TutorialListItem | null> => {
        try {
          const filePath = join(process.cwd(), 'content', tutorialMeta.path);
          const parsed = await parseTutorialMDXCached(filePath);

          const tutorialItem = {
            id: tutorialMeta.id,
            title: tutorialMeta.title,
            description: tutorialMeta.description,
            totalSteps: parsed.metadata.totalSteps || parsed.steps.length,
            difficulty: tutorialMeta.difficulty,
            estimatedTime: tutorialMeta.estimatedTime,
          };

          // Validate the tutorial list item
          const validationResult = TutorialListItemSchema.safeParse(tutorialItem);
          if (!validationResult.success) {
            console.warn(`Invalid tutorial item ${tutorialMeta.id}:`, validationResult.error.message);
            return null;
          }

          return validationResult.data;
        } catch (error) {
          console.warn(`Failed to parse tutorial ${tutorialMeta.id} at ${tutorialMeta.path}:`, error);
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
