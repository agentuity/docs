import { getKVValue, setKVValue } from "@/lib/kv-store";
import { config } from '../config';
import type { UserTutorialState, TutorialProgress, TutorialState } from './types';

export class TutorialStateManager {
  private static getTutorialKey(userId: string): string {
    return `tutorial_state_${userId}`;
  }

  /**
   * Get the complete tutorial state for a user
   */
  static async getUserTutorialState(userId: string): Promise<UserTutorialState> {
    const key = TutorialStateManager.getTutorialKey(userId);
    const response = await getKVValue<UserTutorialState>(key, {
      storeName: config.defaultStoreName
    });

    return response.success && response.data ? response.data : {
      userId,
      tutorials: {}
    };
  }

  /**
   * Update tutorial progress for a user
   */
  static async updateTutorialProgress(
    userId: string,
    tutorialId: string,
    currentStep: number,
    totalSteps: number
  ): Promise<void> {
    const state = await TutorialStateManager.getUserTutorialState(userId);

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

    const key = TutorialStateManager.getTutorialKey(userId);
    try {
      await setKVValue(key, state, { storeName: config.defaultStoreName });
    } catch (error) {
      console.error(
        `Failed to update tutorial state. UserId: ${userId}, Error details:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Get the current active tutorial state for agent communication
   * Returns the most recently accessed tutorial
   */
  static async getCurrentTutorialState(userId: string): Promise<TutorialState | null> {
    const state = await TutorialStateManager.getUserTutorialState(userId);

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
  static async getTutorialProgress(userId: string, tutorialId: string): Promise<TutorialProgress | null> {
    const state = await TutorialStateManager.getUserTutorialState(userId);
    return state.tutorials[tutorialId] || null;
  }

  /**
   * Mark a tutorial as completed
   */
  static async completeTutorial(userId: string, tutorialId: string): Promise<void> {
    const state = await TutorialStateManager.getUserTutorialState(userId);

    if (state.tutorials[tutorialId]) {
      state.tutorials[tutorialId].completedAt = new Date().toISOString();
      state.tutorials[tutorialId].lastAccessedAt = new Date().toISOString();

      const key = TutorialStateManager.getTutorialKey(userId);
      await setKVValue(key, state, { storeName: config.defaultStoreName });
    }
  }

  /**
   * Get all completed tutorials for a user
   */
  static async getCompletedTutorials(userId: string): Promise<TutorialProgress[]> {
    const state = await TutorialStateManager.getUserTutorialState(userId);
    return Object.values(state.tutorials).filter(t => t.completedAt);
  }

  /**
   * Get all active (in-progress) tutorials for a user
   */
  static async getActiveTutorials(userId: string): Promise<TutorialProgress[]> {
    const state = await TutorialStateManager.getUserTutorialState(userId);
    return Object.values(state.tutorials).filter(t => !t.completedAt);
  }
}
