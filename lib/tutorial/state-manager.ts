import { getKVValue, setKVValue } from "@/lib/kv-store";
import { config } from "../config";
import type { UserTutorialState, TutorialProgress, TutorialState } from './types';

function getTutorialKey(userId: string): string {
  return `tutorial_state_${userId}`;
}

/**
 * Get the complete tutorial state for a user
 */
async function getUserTutorialState(userId: string): Promise<UserTutorialState> {
  const key = getTutorialKey(userId);
  const response = await getKVValue<UserTutorialState>(key, {
    storeName: config.kvStoreName
  });

  return response.exists && response.data ? response.data : {
    userId,
    tutorials: {}
  };
}

/**
 * Update tutorial progress for a user
 */
async function updateTutorialProgress(
  userId: string,
  tutorialId: string,
  currentStep: number,
  totalSteps: number
): Promise<void> {
  const state = await getUserTutorialState(userId);

  const existing = state.tutorials[tutorialId];
  const now = new Date().toISOString();

  state.tutorials[tutorialId] = {
    tutorialId,
    currentStep,
    totalSteps,
    startedAt: existing?.startedAt || now,
    lastAccessedAt: now,
    ...(currentStep >= totalSteps ? { completedAt: now } : {})
  };

  const key = getTutorialKey(userId);
  const success = await setKVValue(key, state, { storeName: config.kvStoreName });

  if (!success) {
    console.error(`Failed to update tutorial state. UserId: ${userId}`);
  }
}

/**
 * Get the current active tutorial state for agent communication
 * Returns the most recently accessed tutorial
 */
async function getCurrentTutorialState(userId: string): Promise<TutorialState | null> {
  const state = await getUserTutorialState(userId);

  const tutorials = Object.values(state.tutorials);
  if (tutorials.length === 0) return null;

  // Find the most recently accessed tutorial that's not completed
  const activeTutorials = tutorials.filter(t => !t.completedAt);
  if (activeTutorials.length === 0) return null;

  const mostRecent = activeTutorials.reduce((latest, current) =>
    new Date(current.lastAccessedAt) > new Date(latest.lastAccessedAt) ? current : latest
  );

  return {
    tutorialId: mostRecent.tutorialId,
    currentStep: mostRecent.currentStep
  };
}

/**
 * Get tutorial progress for a specific tutorial
 */
async function getTutorialProgress(userId: string, tutorialId: string): Promise<TutorialProgress | null> {
  const state = await getUserTutorialState(userId);
  return state.tutorials[tutorialId] || null;
}

/**
 * Mark a tutorial as completed
 */
async function completeTutorial(userId: string, tutorialId: string): Promise<void> {
  const state = await getUserTutorialState(userId);

  if (state.tutorials[tutorialId]) {
    state.tutorials[tutorialId].completedAt = new Date().toISOString();
    state.tutorials[tutorialId].lastAccessedAt = new Date().toISOString();

    const key = getTutorialKey(userId);
    await setKVValue(key, state, { storeName: config.kvStoreName });
  }
}

/**
 * Get all completed tutorials for a user
 */
async function getCompletedTutorials(userId: string): Promise<TutorialProgress[]> {
  const state = await getUserTutorialState(userId);
  return Object.values(state.tutorials).filter(t => t.completedAt);
}

/**
 * Get all active (in-progress) tutorials for a user
 */
async function getActiveTutorials(userId: string): Promise<TutorialProgress[]> {
  const state = await getUserTutorialState(userId);
  return Object.values(state.tutorials).filter(t => !t.completedAt);
}

// Backward compatibility alias (following pattern in other services)
export const TutorialStateManager = {
  getUserTutorialState,
  updateTutorialProgress,
  getCurrentTutorialState,
  getTutorialProgress,
  completeTutorial,
  getCompletedTutorials,
  getActiveTutorials,
};

// Export functions for direct import if needed
export {
  getUserTutorialState,
  updateTutorialProgress,
  getCurrentTutorialState,
  getTutorialProgress,
  completeTutorial,
  getCompletedTutorials,
  getActiveTutorials,
};
