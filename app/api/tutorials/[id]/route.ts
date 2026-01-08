import { type NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { parseTutorialMDXCached } from '@/lib/tutorial/mdx-parser';
import { TutorialIdParamsSchema } from '@/lib/tutorial/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rawParams = await params;
    
    // Validate parameters with Zod
    const validationResult = TutorialIdParamsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { id } = validationResult.data;
    const filePath = join(process.cwd(), 'content', 'Tutorial', `${id}.mdx`);
    
    const parsed = await parseTutorialMDXCached(filePath);
    
    return NextResponse.json({
      success: true,
      data: {
        id,
        metadata: parsed.metadata,
        fullContent: parsed.fullContent,
        steps: parsed.steps.map(step => ({
          stepNumber: step.stepNumber,
          title: step.title,
          estimatedTime: step.estimatedTime,
        }))
      }
    });
  } catch (error) {
    console.error('Failed to load tutorial:', error);
    return NextResponse.json(
      { success: false, error: 'Tutorial not found' },
      { status: 404 }
    );
  }
}
