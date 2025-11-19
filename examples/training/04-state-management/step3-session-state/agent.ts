import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

const PreferencesSchema = z.object({
  name: z.string(),
  theme: z.enum(['light', 'dark']).default('light'),
  language: z.enum(['en', 'es', 'fr']).default('en')
});

const agent = createAgent({
  schema: {
    input: z.object({
      userId: z.string(),
      updatePreferences: PreferencesSchema.partial().optional()
    }),
    output: z.object({
      preferences: PreferencesSchema,
      updateCount: z.number(),
      message: z.string()
    })
  },
  metadata: {
    name: 'Session State Agent',
    description: 'Demonstrates user preferences with session state'
  },
  handler: async (c, input) => {
    const userId = input.userId;
    const prefsKey = `preferences_${userId}`;

    // SESSION STATE: Get user preferences (persists across threads)
    let preferences = c.session.state.get(prefsKey) as z.infer<typeof PreferencesSchema> | undefined;

    // Initialize with defaults if first time
    if (!preferences) {
      preferences = {
        name: 'Guest',
        theme: 'light',
        language: 'en'
      };
      c.session.state.set(prefsKey, preferences);
      c.logger.info('New user preferences initialized', { userId });
    }

    // Track update count across all sessions
    const updateCountKey = `updateCount_${userId}`;
    let updateCount = (c.session.state.get(updateCountKey) as number) || 0;

    // Update preferences if provided
    if (input.updatePreferences) {
      preferences = { ...preferences, ...input.updatePreferences };
      c.session.state.set(prefsKey, preferences);
      updateCount += 1;
      c.session.state.set(updateCountKey, updateCount);

      c.logger.info('User preferences updated', {
        userId,
        updateCount,
        changes: input.updatePreferences
      });
    }

    return {
      preferences,
      updateCount,
      message: input.updatePreferences
        ? 'Preferences updated successfully'
        : 'Current preferences retrieved'
    };

    // SESSION STATE persists across thread resets
  }
});

export default agent;
