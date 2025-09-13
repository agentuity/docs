import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MessageSchema, SessionSchema } from '@/app/chat/types';

export interface ValidationError {
  field: string;
  message: string;
  received?: any;
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export function createValidationError(message: string, errors: ValidationError[]): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details: errors.map(err => `${err.field}: ${err.message}`)
    },
    { status: 400 }
  );
}

function zodErrorToValidationErrors(error: z.ZodError): ValidationError[] {
  return error.issues.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
    received: err.received
  }));
}

export async function parseAndValidateJSON<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  let body: any;
  
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const errors = zodErrorToValidationErrors(result.error);
    return {
      success: false,
      response: createValidationError('Validation failed', errors)
    };
  }

  return { success: true, data: result.data };
}

export const TutorialProgressRequestSchema = z.object({
  tutorialId: z.string().min(1),
  currentStep: z.number().int().min(0),
  totalSteps: z.number().int().min(1)
});

export const TutorialResetRequestSchema = z.object({
  tutorialId: z.string().min(1)
});

export const SessionMessageRequestSchema = z.object({
  message: MessageSchema,
  processWithAgent: z.boolean().optional().default(true)
});

export const SessionMessageOnlyRequestSchema = z.object({
  message: MessageSchema
});

export function validateStepNumber(stepNumber: string): ValidationResult<number> {
  const stepIndex = Number.parseInt(stepNumber, 10);
  
  if (Number.isNaN(stepIndex)) {
    return { 
      success: false, 
      errors: [{ field: 'stepNumber', message: 'must be a valid integer', received: stepNumber }] 
    };
  }
  
  if (stepIndex < 1) {
    return { 
      success: false, 
      errors: [{ field: 'stepNumber', message: 'must be greater than 0', received: stepIndex }] 
    };
  }
  
  return { success: true, data: stepIndex };
}

export function validateTutorialId(id: string): ValidationResult<string> {
  if (!id || typeof id !== 'string') {
    return { 
      success: false, 
      errors: [{ field: 'tutorialId', message: 'must be a non-empty string', received: typeof id }] 
    };
  }
  
  if (id.includes('..') || id.includes('/') || id.includes('\\')) {
    return { 
      success: false, 
      errors: [{ field: 'tutorialId', message: 'contains invalid characters (path traversal attempt)', received: id }] 
    };
  }
  
  return { success: true, data: id };
}

export type TutorialProgressRequest = z.infer<typeof TutorialProgressRequestSchema>;
export type TutorialResetRequest = z.infer<typeof TutorialResetRequestSchema>;
export type SessionMessageRequest = z.infer<typeof SessionMessageRequestSchema>;
export type SessionMessageOnlyRequest = z.infer<typeof SessionMessageOnlyRequestSchema>;
