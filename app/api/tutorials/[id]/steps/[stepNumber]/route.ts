import { NextRequest, NextResponse } from 'next/server';
import { readAllTutorials } from '@/lib/tutorial/all-tutorials-reader';
import { getStepByNumber } from '@/lib/tutorial/tutorial-reader';
import { resolve } from 'path';

interface RouteParams {
  params: Promise<{ id: string; stepNumber: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, stepNumber } = await params;
    const basePath = resolve(process.cwd());
    
    // Find tutorial by meta.json ID
    const allTutorials = await readAllTutorials(basePath);
    const tutorial = allTutorials.find(t => t.id === id);
    
    if (!tutorial) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tutorial not found'
        },
        { status: 404 }
      );
    }
    
    const step = getStepByNumber(tutorial, parseInt(stepNumber, 10));
    
    if (!step) {
      return NextResponse.json(
        {
          success: false,
          error: 'Step not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: step
    });
  } catch (error) {
    console.error('Error reading tutorial step:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read tutorial step',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 