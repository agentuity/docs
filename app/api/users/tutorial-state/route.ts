import { NextRequest, NextResponse } from 'next/server';
import { TutorialStateManager } from '@/lib/tutorial/state-manager';

/**
 * GET /api/users/tutorial-state - Get current user's tutorial state
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('chat_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const tutorialState = await TutorialStateManager.getUserTutorialState(userId);
    
    return NextResponse.json({
      success: true,
      data: tutorialState
    });
  } catch (error) {
    console.error('Error getting tutorial state:', error);
    return NextResponse.json(
      { error: 'Failed to get tutorial state' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/tutorial-state - Update tutorial progress
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('chat_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { tutorialId, currentStep, totalSteps } = await request.json();
    
    if (!tutorialId || typeof currentStep !== 'number' || typeof totalSteps !== 'number') {
      return NextResponse.json(
        { error: 'Invalid tutorial data. Required: tutorialId, currentStep, totalSteps' },
        { status: 400 }
      );
    }

    await TutorialStateManager.updateTutorialProgress(
      userId,
      tutorialId,
      currentStep,
      totalSteps
    );

    return NextResponse.json({
      success: true,
      message: 'Tutorial progress updated'
    });
  } catch (error) {
    console.error('Error updating tutorial state:', error);
    return NextResponse.json(
      { error: 'Failed to update tutorial state' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/tutorial-state - Reset tutorial progress
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.cookies.get('chat_user_id')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 });
    }

    const { tutorialId } = await request.json();
    
    if (!tutorialId) {
      return NextResponse.json(
        { error: 'tutorialId is required' },
        { status: 400 }
      );
    }

    const state = await TutorialStateManager.getUserTutorialState(userId);
    delete state.tutorials[tutorialId];
    
    // Save the updated state
    const { setKVValue } = await import('@/lib/kv-store');
    const { config } = await import('@/lib/config');
    
    await setKVValue(`tutorial_state_${userId}`, state, { 
      storeName: config.defaultStoreName 
    });

    return NextResponse.json({
      success: true,
      message: 'Tutorial progress reset'
    });
  } catch (error) {
    console.error('Error resetting tutorial state:', error);
    return NextResponse.json(
      { error: 'Failed to reset tutorial state' },
      { status: 500 }
    );
  }
}
