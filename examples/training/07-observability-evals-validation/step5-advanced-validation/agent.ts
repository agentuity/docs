import { createAgent } from '@agentuity/runtime';
import { z } from 'zod';

export const agent = createAgent({
  schema: {
    input: z.object({
      // Transform: lowercase and trim email
      email: z.string()
        .email()
        .toLowerCase()
        .trim(),

      // Refinement: custom password rules
      password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .refine(
          pwd => /[A-Z]/.test(pwd) && /[0-9]/.test(pwd),
          { message: 'Password must contain uppercase letter and number' }
        ),

      // Transform: parse string to number
      age: z.string()
        .transform(val => Number.parseInt(val, 10))
        .pipe(z.number().min(13).max(120)),

      // Date fields for cross-field validation
      startDate: z.string().datetime(),
      endDate: z.string().datetime()
    }).refine(
      // Cross-field validation: endDate must be after startDate
      data => new Date(data.endDate) > new Date(data.startDate),
      { message: 'End date must be after start date' }
    ),

    output: z.object({
      success: z.boolean(),
      userId: z.string()
    })
  },
  metadata: {
    name: 'User Registration',
    description: 'Validates user input with advanced patterns'
  },
  handler: async (c, input) => {
    // Input is already validated and transformed
    c.logger.info('Creating user', {
      email: input.email,  // Already lowercase and trimmed
      age: input.age       // Already a number
    });

    // Create user (simplified)
    const userId = crypto.randomUUID();

    return {
      success: true,
      userId
    };
  }
});
