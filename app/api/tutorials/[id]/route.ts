import { NextRequest, NextResponse } from 'next/server';
import { readAllTutorials } from '@/lib/tutorial/all-tutorials-reader';
import { resolve } from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const basePath = resolve(process.cwd());
    
    // Read all tutorials and find the one with matching ID from meta.json
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
    
    return NextResponse.json({
      success: true,
      data: tutorial
    });
  } catch (error) {
    console.error('Error reading tutorial:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read tutorial',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 