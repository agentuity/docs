import { NextRequest, NextResponse } from 'next/server';
import { readAllTutorials } from '@/lib/tutorial/all-tutorials-reader';
import { resolve } from 'path';

export async function GET(request: NextRequest) {
  try {
    // Look for tutorials in the project root
    const basePath = resolve(process.cwd());
    const allTutorials = await readAllTutorials(basePath);
    
    // Return only summary information from meta.json
    const summaries = allTutorials.tutorials.map(tutorial => ({
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description,
      totalSteps: tutorial.totalSteps
    }));
    
    return NextResponse.json({
      success: true,
      data: summaries
    });
  } catch (error) {
    console.error('Error reading tutorials:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read tutorials',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 