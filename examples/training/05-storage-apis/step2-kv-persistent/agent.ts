import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

const PreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']),
  language: z.string(),
  notifications: z.boolean()
});

const agent = createAgent({
  schema: {
    input: z.object({
      userId: z.string(),
      updatePreferences: PreferencesSchema.partial().optional()
    }),
    output: z.object({
      preferences: PreferencesSchema,
      source: z.enum(['existing', 'default']),
      updated: z.boolean()
    })
  },
  metadata: {
    name: 'KV Persistent Agent',
    description: 'Demonstrates persistent KV storage without TTL'
  },
  handler: async (c, input) => {
    const bucket = 'user-preferences';
    const key = `prefs:${input.userId}`;

    // Load existing preferences (no TTL - persists indefinitely)
    const result = await c.kv.get(bucket, key);

    let preferences: z.infer<typeof PreferencesSchema>;
    let source: 'existing' | 'default' = 'default';
    let updated = false;

    if (result.exists) {
      // User has existing preferences
      preferences = result.data as z.infer<typeof PreferencesSchema>;
      source = 'existing';

      c.logger.info('Loaded existing preferences', {
        userId: input.userId
      });
    } else {
      // New user - initialize with defaults
      preferences = {
        theme: 'light',
        language: 'en',
        notifications: true
      };

      c.logger.info('Initialized default preferences', {
        userId: input.userId
      });
    }

    // Update preferences if provided
    if (input.updatePreferences) {
      preferences = {
        ...preferences,
        ...input.updatePreferences
      };

      // Save to KV storage WITHOUT TTL (persists indefinitely)
      await c.kv.set(bucket, key, preferences);

      updated = true;

      c.logger.info('Updated user preferences', {
        userId: input.userId,
        changes: input.updatePreferences
      });
    }

    return {
      preferences,
      source,
      updated
    };
  }
});

export default agent;
