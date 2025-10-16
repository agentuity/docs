import type { AgentRequest, AgentResponse, AgentContext } from "@agentuity/sdk";

export default async function Agent(
  request: AgentRequest,
  response: AgentResponse,
  context: AgentContext
) {
  const bucket = 'user-profiles';
  const userId = 'user-123'; // In production, get from request.metadata

  try {
    // Get user input (preference to update)
    const data = await request.data.json();
    const { theme, language } = data;

    // Retrieve existing user profile
    const result = await context.kv.get(bucket, userId);

    let profile;
    if (result.exists) {
      // Existing user - load and update profile
      profile = await result.data.json();
      profile.lastSeen = new Date().toISOString();
      profile.interactionCount = (profile.interactionCount || 0) + 1;

      context.logger.info(`Updating profile for returning user (${profile.interactionCount} interactions)`);
    } else {
      // New user - create profile
      profile = {
        userId: userId,
        preferences: {},
        created: new Date().toISOString(),
        interactionCount: 1
      };

      context.logger.info('Creating new user profile');
    }

    // Update preferences if provided
    if (theme) {
      profile.preferences.theme = theme;
    }
    if (language) {
      profile.preferences.language = language;
    }

    // Save profile WITHOUT TTL (permanent storage)
    await context.kv.set(bucket, userId, profile);

    context.logger.info('Saved user profile (permanent storage)');

    // Return updated profile
    return response.json({
      message: 'Profile updated successfully',
      profile: profile,
      storage: 'permanent (no TTL)'
    });

  } catch (error) {
    context.logger.error('Error managing user profile:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
