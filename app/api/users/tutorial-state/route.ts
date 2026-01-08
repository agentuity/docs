import { type NextRequest, NextResponse } from 'next/server';
import { TutorialStateManager } from '@/lib/tutorial/state-manager';
import { setKVValue } from '@/lib/kv-store';
import { config } from '@/lib/config';
import { 
  parseAndValidateJSON, 
  TutorialProgressRequestSchema, 
  TutorialResetRequestSchema 
} from '@/lib/validation/middleware';

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

    const validation = await parseAndValidateJSON(request, TutorialProgressRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { tutorialId, currentStep, totalSteps } = validation.data;

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

    const validation = await parseAndValidateJSON(request, TutorialResetRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { tutorialId } = validation.data;

    const state = await TutorialStateManager.getUserTutorialState(userId);
    if (!state.tutorials) {
      state.tutorials = {};
    }
    delete state.tutorials[tutorialId];

    // Save the updated state
    const kvResponse = await setKVValue(`tutorial_state_${userId}`, state, {
      storeName: config.defaultStoreName
    });

    if (!kvResponse.success) {
      return NextResponse.json(
        { error: kvResponse.error || 'Failed to reset tutorial state' },
        { status: kvResponse.statusCode || 500 }
      );
    }

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
