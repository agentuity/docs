import { type NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { parseTutorialMDXCached } from '@/lib/tutorial/mdx-parser';
import { StepParamsSchema } from '@/lib/tutorial/schemas';

interface RouteParams {
  params: Promise<{ id: string; stepNumber: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rawParams = await params;
    
    // Validate and transform parameters with Zod
    const validationResult = StepParamsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { id, stepNumber: stepNum } = validationResult.data;
    
    const filePath = join(process.cwd(), 'content', 'Tutorial', `${id}.mdx`);
    const parsed = await parseTutorialMDXCached(filePath);
    
    const step = parsed.steps.find(s => s.stepNumber === stepNum);
    if (!step) {
      return NextResponse.json(
        { success: false, error: 'Step not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        tutorialId: id,
        totalSteps: parsed.metadata.totalSteps,
        currentStep: stepNum,
        tutorialStep: {
          title: step.title,
          mdx: step.mdxContent,
          snippets: step.snippets,
          totalSteps: parsed.metadata.totalSteps,
          estimatedTime: step.estimatedTime,
        }
      }
    });
  } catch (error) {
    console.error('Failed to load tutorial step:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load step' },
      { status: 500 }
    );
  }
}
