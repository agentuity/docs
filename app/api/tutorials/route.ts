import { NextRequest, NextResponse } from 'next/server';
import { readAllTutorials } from '@/lib/tutorial/all-tutorials-reader';
import { resolve } from 'path';

export async function GET(request: NextRequest) {
  try {
    const basePath = resolve(process.cwd());
    const allTutorials = await readAllTutorials(basePath);

    const summaries = allTutorials.map(tutorial => ({
      id: tutorial.id,
      title: tutorial.title,
      description: tutorial.description,
      totalSteps: tutorial.totalSteps
    }));

    return NextResponse.json(summaries);
  } catch (error) {
    console.error('Error reading tutorials:', error);

    // Return proper HTTP error status with minimal error info
    return NextResponse.json(
      { error: 'Failed to read tutorials' },
      { status: 500 }
    );
  }
} 